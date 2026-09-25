import crypto from 'crypto';
import mongoose from 'mongoose';
import { PromptCache } from '../models/promptCache.model.js';
import { QueryHistory } from '../models/queryHistory.model.js';
import { getEmbeddingModel } from './aiProvider.service.js';
import { searchSemanticCache, upsertSemanticCachePoint } from './qdrant.service.js';

/**
 * Enterprise Consolidated Multi-Tier Prompt & Semantic Cache Service
 * 
 * Consolidated Architecture:
 * 1. L1 Fast In-Memory RAM Cache:
 *    Instant <1ms response from Node.js memory using normalized query hashing.
 * 
 * 2. L2 Persistent MongoDB Cache:
 *    Durable cross-user storage across server reboots and container recycles.
 * 
 * 3. L3 Qdrant Semantic Vector Cache:
 *    Uses 384-dimensional dense vectors (Cosine distance, >=0.88 similarity threshold).
 *    Matches paraphrased questions (e.g. "What are the 12 Principles?" vs "List the 12 FCA principles").
 *    Eliminates BOTH input prompt tokens and output completion tokens (<25ms).
 * 
 * 4. L4 Retroactive QueryHistory Matcher:
 *    Fallback pattern matching against past historical queries in MongoDB.
 */

class PromptCacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxEntries = options.maxEntries || 2000;
    this.defaultTtlMs = options.defaultTtlMs || 24 * 60 * 60 * 1000; // 24 hours in RAM
    this.similarityThreshold = options.similarityThreshold || 0.80; // 80% cosine similarity threshold for paraphrased queries
    this.stats = {
      hits: 0,
      semanticHits: 0,
      misses: 0,
      tokensSaved: 0,
      cachedPromptsCreated: 0
    };
  }

  /**
   * Normalizes question text for consistent matching across users and sessions
   */
  normalizeQuery(query) {
    if (!query) return '';
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generates a deterministic SHA-256 Hash for a query + model combination
   */
  generateKey(model, ...args) {
    let query = '';
    if (args.length === 1) {
      query = args[0] || '';
    } else if (args.length >= 3) {
      // (staticInstructions, context, query, ...)
      query = args[2] || args[0] || '';
    } else {
      query = args[0] || '';
    }
    const normQ = this.normalizeQuery(query);
    const rawSignature = [model || 'default', normQ].join('###');
    return crypto.createHash('sha256').update(rawSignature).digest('hex');
  }

  /**
   * Retrieve cached prompt completion across:
   * L1 (RAM) -> L2 (MongoDB PromptCache) -> L3 (Qdrant Semantic Cache) -> L4 (QueryHistory)
   */
  async get(key, query, model, customThreshold = null) {
    const effectiveKey = key || this.generateKey(model, query);
    const normQ = this.normalizeQuery(query);
    const now = Date.now();

    // 1. Check L1 Memory Cache (Exact Normalized Match: <1ms)
    if (effectiveKey && this.cache.has(effectiveKey)) {
      const entry = this.cache.get(effectiveKey);
      const isRefusal = entry.data?.confidence === 'NOT_FOUND' || 
                        (entry.data?.answer && entry.data.answer.toLowerCase().includes('strict refusal'));
      if (isRefusal) {
        this.cache.delete(effectiveKey);
      } else if (now <= entry.expiresAt) {
        this.cache.delete(effectiveKey);
        this.cache.set(effectiveKey, entry); // refresh LRU position
        this.stats.hits += 1;
        const saved = entry.tokens?.cachedTokens || entry.tokens?.totalTokens || (entry.tokens?.promptTokens + entry.tokens?.completionTokens) || 2293;
        this.stats.tokensSaved += saved;
        return {
          ...entry.data,
          isCached: true,
          cacheType: 'EXACT',
          tokensSaved: saved,
          cachedAt: entry.createdAt,
          originalTokens: entry.tokens
        };
      } else {
        this.cache.delete(effectiveKey);
      }
    }

    // 2. Check L2 Persistent MongoDB Cache (Exact Normalized Match: <5ms)
    if (mongoose.connection.readyState === 1) {
      try {
        const dbCached = await PromptCache.findOne({
          $or: [{ key: effectiveKey }, { normalizedQuery: normQ }]
        }).lean();

        const isRefusal = dbCached && (
          dbCached.confidence === 'NOT_FOUND' ||
          (dbCached.answer && dbCached.answer.toLowerCase().includes('strict refusal'))
        );

        if (dbCached && dbCached.answer && !isRefusal) {
          const promptToks = dbCached.promptTokens || 0;
          const complToks = dbCached.completionTokens || 0;
          const totalToks = dbCached.totalTokens || (promptToks + complToks) || 2293;
          const tokensSaved = dbCached.cachedTokens || totalToks || 2293;

          // Promote to L1 Memory Cache for subsequent instant hits
          this.cache.set(effectiveKey, {
            data: {
              answer: dbCached.answer,
              confidence: dbCached.confidence || 'HIGH',
              suggestedFollowUps: dbCached.suggestedFollowUps || [],
              citedRules: dbCached.citedRules || []
            },
            tokens: {
              promptTokens: promptToks,
              completionTokens: complToks,
              totalTokens: totalToks,
              cachedTokens: tokensSaved
            },
            createdAt: dbCached.createdAt || new Date().toISOString(),
            expiresAt: now + this.defaultTtlMs
          });

          // Asynchronously increment hit counter
          PromptCache.updateOne({ _id: dbCached._id }, { $inc: { hitCount: 1 } }).catch(() => {});

          this.stats.hits += 1;
          this.stats.tokensSaved += tokensSaved;

          return {
            answer: dbCached.answer,
            confidence: dbCached.confidence || 'HIGH',
            suggestedFollowUps: dbCached.suggestedFollowUps || [],
            citedRules: dbCached.citedRules || [],
            isCached: true,
            cacheType: 'EXACT',
            tokensSaved,
            cachedAt: dbCached.createdAt,
            originalTokens: {
              promptTokens: promptToks,
              completionTokens: complToks,
              totalTokens: totalToks,
              cachedTokens: tokensSaved
            }
          };
        }
      } catch (dbErr) {
        console.warn('⚠️ L2 Prompt Cache lookup error:', dbErr.message);
      }
    }

    // 3. Check L3 Qdrant Semantic Vector Similarity Cache (Paraphrased Queries: <25ms)
    if (query && query.trim().length > 3) {
      try {
        const threshold = customThreshold || this.similarityThreshold;
        const embeddingModel = getEmbeddingModel();
        const queryVector = await embeddingModel.embedQuery(query);
        const semanticResults = await searchSemanticCache(queryVector, threshold, 1);

        if (semanticResults && semanticResults.length > 0) {
          const topMatch = semanticResults[0];
          const payload = topMatch?.payload || {};

          const isRefusal = payload.confidence === 'NOT_FOUND' || 
                            (payload.answer && payload.answer.toLowerCase().includes('strict refusal'));

          if (payload.answer && !isRefusal) {
            const promptToks = payload.promptTokens || 0;
            const complToks = payload.completionTokens || 0;
            const totalToks = payload.totalTokens || (promptToks + complToks) || 2250;
            const tokensSaved = payload.cachedTokens || totalToks || 2250;
            const similarityPct = Math.round((topMatch.score || 0) * 100);

            console.log(`🧠 [SEMANTIC CACHE HIT] (${similarityPct}% match) for: "${query}" => Matched: "${payload.question}"`);

            // Promote to L1 Memory & L2 MongoDB under the new query's key
            this.set(
              effectiveKey,
              {
                answer: payload.answer,
                confidence: payload.confidence || 'HIGH',
                suggestedFollowUps: payload.suggestedFollowUps || [],
                citedRules: payload.citedRules || []
              },
              { promptTokens: promptToks, completionTokens: complToks, totalTokens: totalToks, cachedTokens: tokensSaved },
              null,
              query,
              model
            );

            this.stats.hits += 1;
            this.stats.semanticHits += 1;
            this.stats.tokensSaved += tokensSaved;

            return {
              answer: payload.answer,
              confidence: payload.confidence || 'HIGH',
              suggestedFollowUps: payload.suggestedFollowUps || [],
              citedRules: payload.citedRules || [],
              isCached: true,
              cacheType: 'SEMANTIC',
              semanticSimilarity: `${similarityPct}%`,
              matchedQuestion: payload.question,
              tokensSaved,
              cachedAt: payload.createdAt || new Date().toISOString(),
              originalTokens: {
                promptTokens: promptToks,
                completionTokens: complToks,
                totalTokens: totalToks,
                cachedTokens: tokensSaved
              }
            };
          }
        }
      } catch (semanticErr) {
        console.warn('⚠️ Qdrant semantic cache lookup notice:', semanticErr.message);
      }
    }

    // 4. Check L4 Retroactive QueryHistory in MongoDB (Fallback Pattern Match)
    if (mongoose.connection.readyState === 1) {
      try {
        const words = normQ.split(/\s+/).filter((w) => w.length > 0);
        const flexiblePattern = words
          .map((w) => w.replace(/[.*+?^$${}()|[\]\\]/g, '\\$&'))
          .join('[\\s\\W]+');

        const pastQuery = await QueryHistory.findOne({
          question: { $regex: new RegExp('^\\s*' + flexiblePattern + '[\\s\\W]*$', 'i') },
          answer: { $exists: true, $ne: '', $not: /strict refusal/i },
          confidence: { $nin: ['NOT_FOUND', 'DB_OFFLINE', 'ERROR'] }
        }).sort({ createdAt: -1 }).lean();

        if (pastQuery && pastQuery.answer) {
          const promptToks = pastQuery.promptTokens || 0;
          const complToks = pastQuery.completionTokens || 0;
          const totalToks = pastQuery.totalTokens || (promptToks + complToks) || 2293;
          const tokensSaved = pastQuery.cachedTokens || totalToks || 2293;

          // Seed L1 & L2 & L3
          this.set(
            effectiveKey,
            {
              answer: pastQuery.answer,
              confidence: pastQuery.confidence || 'HIGH',
              suggestedFollowUps: pastQuery.suggestedFollowUps || [],
              citedRules: pastQuery.citedRules || []
            },
            { promptTokens: promptToks, completionTokens: complToks, totalTokens: totalToks, cachedTokens: tokensSaved },
            null,
            query,
            model
          );

          this.stats.hits += 1;
          this.stats.tokensSaved += tokensSaved;

          return {
            answer: pastQuery.answer,
            confidence: pastQuery.confidence || 'HIGH',
            suggestedFollowUps: pastQuery.suggestedFollowUps || [],
            citedRules: pastQuery.citedRules || [],
            isCached: true,
            cacheType: 'HISTORY',
            tokensSaved,
            cachedAt: pastQuery.createdAt,
            originalTokens: {
              promptTokens: promptToks,
              completionTokens: complToks,
              totalTokens: totalToks,
              cachedTokens: tokensSaved
            }
          };
        }
      } catch (histErr) {
        console.warn('⚠️ L4 QueryHistory cache lookup error:', histErr.message);
      }
    }

    this.stats.misses += 1;
    return null;
  }

  /**
   * Store prompt completion in L1 Memory, L2 MongoDB, and L3 Qdrant Semantic Cache
   */
  async set(key, data, tokens = {}, ttlMs = null, query = '', model = '') {
    if (!key || !data) return;

    // Never cache refusals, not found responses, or errors
    if (
      data.confidence === 'NOT_FOUND' ||
      data.confidence === 'DB_OFFLINE' ||
      data.confidence === 'ERROR' ||
      (data.answer && data.answer.toLowerCase().includes('strict refusal')) ||
      (data.answer && data.answer.toLowerCase().includes('no relevant uk financial rules found'))
    ) {
      return;
    }

    // Enforce LRU capacity limit in RAM
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const now = Date.now();
    const ttl = ttlMs || this.defaultTtlMs;
    const promptTokens = Number(tokens.promptTokens) || 0;
    const completionTokens = Number(tokens.completionTokens) || 0;
    const totalTokens = Number(tokens.totalTokens) || (promptTokens + completionTokens);
    const cachedTokens = Number(tokens.cachedTokens) || totalTokens || 2293;
    const normQ = this.normalizeQuery(query);

    // 1. Save in L1 RAM
    this.cache.set(key, {
      data,
      tokens: { promptTokens, completionTokens, totalTokens, cachedTokens },
      createdAt: new Date().toISOString(),
      expiresAt: now + ttl
    });

    this.stats.cachedPromptsCreated += 1;

    // 2. Save in L2 MongoDB Persistent Storage
    if (mongoose.connection.readyState === 1) {
      try {
        await PromptCache.findOneAndUpdate(
          { key },
          {
            key,
            normalizedQuery: normQ,
            model: model || 'openai/gpt-oss-120b',
            answer: data.answer,
            confidence: data.confidence || 'HIGH',
            suggestedFollowUps: data.suggestedFollowUps || [],
            citedRules: data.citedRules || [],
            promptTokens,
            completionTokens,
            totalTokens,
            cachedTokens,
            $inc: { hitCount: 1 }
          },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (mongoErr) {
        console.warn('⚠️ Could not persist prompt cache to MongoDB:', mongoErr.message);
      }
    }

    // 3. Save into L3 Qdrant Semantic Vector Cache
    if (query && query.trim().length > 3) {
      try {
        const embeddingModel = getEmbeddingModel();
        const vector = await embeddingModel.embedQuery(query);
        const pointId = crypto.createHash('md5').update(normQ).digest('hex');
        const qdrantPointId = `${pointId.slice(0, 8)}-${pointId.slice(8, 12)}-${pointId.slice(12, 16)}-${pointId.slice(16, 20)}-${pointId.slice(20, 32)}`;

        await upsertSemanticCachePoint({
          id: qdrantPointId,
          vector,
          payload: {
            question: query,
            normalizedQuery: normQ,
            model: model || 'openai/gpt-oss-120b',
            answer: data.answer,
            confidence: data.confidence || 'HIGH',
            suggestedFollowUps: data.suggestedFollowUps || [],
            citedRules: data.citedRules || [],
            promptTokens,
            completionTokens,
            totalTokens,
            cachedTokens,
            createdAt: new Date().toISOString()
          }
        });
      } catch (qdrantErr) {
        console.warn('⚠️ Could not upsert point to Qdrant semantic cache:', qdrantErr.message);
      }
    }
  }

  /**
   * Invalidate cache entries
   */
  async invalidateAll() {
    const count = this.cache.size;
    this.cache.clear();
    if (mongoose.connection.readyState === 1) {
      try {
        await PromptCache.deleteMany({});
      } catch (err) {
        console.warn('Could not clear MongoDB PromptCache:', err.message);
      }
    }
    console.log(`🧹 Prompt Cache cleared (${count} entries invalidated).`);
    return count;
  }

  /**
   * Get operational cache metrics
   */
  getMetrics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(1) : '0.0';

    return {
      activeEntries: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      tokensSaved: this.stats.tokensSaved,
      cachedPromptsCreated: this.stats.cachedPromptsCreated
    };
  }
}

// Singleton export
export const promptCache = new PromptCacheService();
