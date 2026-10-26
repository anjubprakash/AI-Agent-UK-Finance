import crypto from 'crypto';
import mongoose from 'mongoose';
import { PromptCache } from '../models/promptCache.model.js';
import { QueryHistory } from '../models/queryHistory.model.js';
import { getEmbeddingModel } from './aiProvider.service.js';
import { searchSemanticCache, upsertSemanticCachePoint } from './qdrant.service.js';

/**
 * Enterprise Consolidated Persistent & Semantic Cache Service
 * 
 * Architecture (Zero-RAM Overhead):
 * 1. Persistent MongoDB Cache:
 *    Durable cross-user storage across server reboots. Instant lookup using normalized query and SHA-256 hash. Zero RAM overhead.
 * 
 * 2. Qdrant Semantic Vector Cache:
 *    Uses 384-dimensional dense vectors (Cosine distance, >=0.80 similarity threshold).
 *    Matches paraphrased questions (e.g. "What are the 12 Principles?" vs "List the 12 FCA principles").
 *    Zero Node.js heap/RAM storage!
 * 
 * 3. Retroactive QueryHistory Matcher:
 *    Fallback pattern matching against past historical queries in MongoDB.
 */

class PromptCacheService {
  constructor(options = {}) {
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
   * 1. Persistent MongoDB Cache -> 2. Qdrant Semantic Vector Cache -> 3. Fallback QueryHistory in MongoDB
   * (Zero RAM memory used)
   */
  async get(key, query, model, customThreshold = null) {
    const effectiveKey = key || this.generateKey(model, query);
    const normQ = this.normalizeQuery(query);

    // 1. Check Persistent MongoDB Cache (Exact Normalized Match: <5ms, Zero RAM)
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

          // Asynchronously increment hit counter in MongoDB
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
        console.warn('⚠️ MongoDB Prompt Cache lookup error:', dbErr.message);
      }
    }

    // 2. Check Qdrant Semantic Vector Similarity Cache (Paraphrased Queries: <25ms, Zero RAM)
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

            // Persist to MongoDB under this new phrasing's exact key for subsequent queries
            if (mongoose.connection.readyState === 1) {
              PromptCache.findOneAndUpdate(
                { key: effectiveKey },
                {
                  key: effectiveKey,
                  normalizedQuery: normQ,
                  model: model || 'openai/gpt-oss-120b',
                  answer: payload.answer,
                  confidence: payload.confidence || 'HIGH',
                  suggestedFollowUps: payload.suggestedFollowUps || [],
                  citedRules: payload.citedRules || [],
                  promptTokens: promptToks,
                  completionTokens: complToks,
                  totalTokens: totalToks,
                  cachedTokens: tokensSaved,
                  $inc: { hitCount: 1 }
                },
                { upsert: true }
              ).catch(() => {});
            }

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

    // 3. Check Retroactive QueryHistory in MongoDB (Fallback Pattern Match, Zero RAM)
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

          // Seed MongoDB PromptCache & Qdrant Semantic Cache (Zero RAM storage)
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
        console.warn('⚠️ QueryHistory cache lookup error:', histErr.message);
      }
    }

    this.stats.misses += 1;
    return null;
  }

  /**
   * Store prompt completion in MongoDB and Qdrant Semantic Vector Cache
   * (Zero RAM memory used)
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

    const promptTokens = Number(tokens.promptTokens) || 0;
    const completionTokens = Number(tokens.completionTokens) || 0;
    const totalTokens = Number(tokens.totalTokens) || (promptTokens + completionTokens);
    const cachedTokens = Number(tokens.cachedTokens) || totalTokens || 2293;
    const normQ = this.normalizeQuery(query);

    this.stats.cachedPromptsCreated += 1;

    // 1. Save in MongoDB Persistent Storage (0 RAM usage)
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

    // 2. Save into Qdrant Semantic Vector Cache (0 RAM usage)
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
    let count = 0;
    if (mongoose.connection.readyState === 1) {
      try {
        const res = await PromptCache.deleteMany({});
        count = res?.deletedCount || 0;
      } catch (err) {
        console.warn('Could not clear MongoDB PromptCache:', err.message);
      }
    }
    console.log(`🧹 Prompt Cache cleared (${count} MongoDB entries deleted, 0 RAM used).`);
    return count;
  }

  /**
   * Get operational cache metrics
   */
  getMetrics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(1) : '0.0';

    return {
      activeEntries: 0, // Zero RAM usage
      storage: 'MongoDB + Qdrant Vector Search',
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
