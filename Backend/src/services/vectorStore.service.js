import crypto from 'crypto';
import { getEmbeddingModel, getGroqClient } from './aiProvider.service.js';
import { getQdrantClient, upsertRuleVectors, searchRuleVectors, getStoredVectorCount, getPointsByDocumentId } from './qdrant.service.js';
import { splitFcaHandbookIntoSemanticChunks } from './fcaParser.service.js';
import { Notification } from '../models/notification.model.js';
import { QueryHistory } from '../models/queryHistory.model.js';
import { env } from '../config/env.js';

// Index UK Regulatory Document chunks into Qdrant Vector Store with FCA Structure & Table Awareness
export const indexRegulatoryDocument = async (document, onProgress = null) => {
  const rawText = document.rawText;
  if (!rawText) return [];

  // 1. Split document using FCA Handbook Structure-Aware Chunking
  const parsedChunks = splitFcaHandbookIntoSemanticChunks(rawText, {
    title: document.title || '',
    authority: document.authority || 'FCA',
    category: document.category || '',
    ruleCode: document.ruleCode || ''
  });

  if (parsedChunks.length === 0) return [];

  console.log(`📦 [${document.title}] Generated ${parsedChunks.length} cohesive semantic chunks. Starting embedding & indexing into Qdrant...`);

  if (typeof onProgress === 'function') {
    onProgress({
      stage: 'parsing',
      percent: 25,
      processed: 0,
      totalChunks: parsedChunks.length,
      currentBatch: 0,
      totalBatches: Math.ceil(parsedChunks.length / 32),
      batchPercent: 0,
      message: `Generated ${parsedChunks.length} semantic chunks. Starting embeddings...`
    });
  }

  const embeddingModel = getEmbeddingModel();
  const allPoints = [];
  const BATCH_SIZE = 32; // Optimal batch size for local all-MiniLM-L6-v2 ONNX CPU inference
  const totalBatches = Math.ceil(parsedChunks.length / BATCH_SIZE);

  // 2. Batch embedding generation, formulation, and live Qdrant streaming
  for (let i = 0; i < parsedChunks.length; i += BATCH_SIZE) {
    const batch = parsedChunks.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map((c) => c.content);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const processed = Math.min(i + batch.length, parsedChunks.length);
    const pct = Math.round((processed / parsedChunks.length) * 100);

    console.log(`⚡ [${document.title}] Embedding batch ${batchNum}/${totalBatches} (${processed}/${parsedChunks.length} chunks - ${pct}%)...`);

    if (typeof onProgress === 'function') {
      const overallPercent = 25 + Math.round((processed / parsedChunks.length) * 70); // 25% -> 95%
      onProgress({
        stage: 'embedding',
        percent: Math.min(overallPercent, 96),
        processed,
        totalChunks: parsedChunks.length,
        currentBatch: batchNum,
        totalBatches,
        batchPercent: pct,
        message: `Embedding batch ${batchNum}/${totalBatches} (${processed}/${parsedChunks.length} chunks - ${pct}%)...`
      });
    }

    // Generate embeddings for current batch
    const batchEmbeddings = await embeddingModel.embedDocuments(batchTexts);

    const batchPoints = batch.map((chunk, bIdx) => {
      const globalIdx = i + bIdx;
      const idHash = crypto.createHash('md5').update(`${document._id}_chunk_${globalIdx}`).digest('hex');
      const pointId = `${idHash.slice(0, 8)}-${idHash.slice(8, 12)}-${idHash.slice(12, 16)}-${idHash.slice(16, 20)}-${idHash.slice(20, 32)}`;

      return {
        id: pointId,
        vector: batchEmbeddings[bIdx],
        payload: {
          documentId: document._id.toString(),
          title: document.title || '',
          authority: document.authority || 'FCA',
          category: document.category || '',
          ruleCode: chunk.ruleCode || document.ruleCode || '',
          sectionTitle: chunk.sectionTitle || '',
          ruleType: chunk.ruleType || 'Regulatory Clause',
          isSchedule: Boolean(chunk.isSchedule),
          version: document.version || '1.0',
          chunkIndex: globalIdx,
          content: chunk.content
        }
      };
    });

    // Stream points directly into Qdrant as each batch finishes
    try {
      await upsertRuleVectors(batchPoints);
    } catch (err) {
      document.status = 'FAILED';
      await document.save();
      throw err;
    }

    allPoints.push(...batchPoints);

    // Yield event loop so concurrent requests (e.g. notifications polling) are never starved
    await new Promise((resolve) => setImmediate(resolve));
  }

  // 3. Update Document record status & chunk count in database
  document.status = 'INDEXED';
  document.chunkCount = allPoints.length;
  await document.save();

  if (typeof onProgress === 'function') {
    onProgress({
      stage: 'completed',
      percent: 100,
      processed: allPoints.length,
      totalChunks: allPoints.length,
      currentBatch: totalBatches,
      totalBatches,
      batchPercent: 100,
      message: `Successfully indexed all ${allPoints.length} semantic chunks into Qdrant!`
    });
  }

  console.log(`✅ [${document.title}] Successfully indexed all ${allPoints.length} semantic chunks into Qdrant.`);
  return allPoints;
};

// Search Qdrant knowledge base for relevant UK financial rules matching a query with hybrid scoring & strict thresholding
export const searchSimilarRules = async (queryText, limit = 5) => {
  if (!queryText || !queryText.trim()) return [];

  // 1. Verify that vector store contains indexed points
  const totalCount = await getStoredVectorCount();
  if (totalCount === 0) {
    return [];
  }

  // 2. Perform Semantic Vector Search with larger initial candidate pool
  let semanticResults = [];
  try {
    const embeddingModel = getEmbeddingModel();
    if (embeddingModel) {
      const queryVector = await embeddingModel.embedQuery(queryText);
      // Increased candidate pool to 100 to ensure dense handbooks with dozens of sub-clauses are never cut off
      semanticResults = await searchRuleVectors(queryVector, Math.max(limit * 20, 100));
    }
  } catch (vecErr) {
    console.warn('⚠️ Vector search encounter error (falling back to hybrid rule matching):', vecErr.message);
  }

  // 3. Extract rule code patterns & sourcebook identifiers (case-insensitive)
  const SOURCEBOOKS_REGEX = /\b(CONC|FIT|PRIN|SYSC|COBS|MCOB|SUP|CASS|GEN|DISP|COCON|BCOBS|ICOBS|MAR|PROD)\b/gi;
  const rulePattern = /\b(?:CONC|FIT|PRIN|SYSC|COBS|MCOB|SUP|CASS|GEN|DISP|COCON|BCOBS|ICOBS|MAR|PROD)\s*(?:[0-9]+[A-Z0-9]*(?:\.[0-9]+[A-Z0-9]*)*(?:-[0-9]+)?|TP\s*[0-9]+(?:\.[0-9]+)*|Sch\s*[0-9]+(?:\.[0-9]+)*)\b/gi;

  const qLower = queryText.toLowerCase();
  const rawRuleMatches = (queryText.match(rulePattern) || []).map((r) => r.toLowerCase().replace(/\s+/g, ' '));
  const specificRuleSet = new Set(rawRuleMatches);

  for (const rm of rawRuleMatches) {
    const withoutSuffix = rm.replace(/[a-z]$/i, '').trim();
    if (withoutSuffix && withoutSuffix !== rm) {
      specificRuleSet.add(withoutSuffix);
    }
    const parts = rm.split(/[\s.]+/);
    if (parts.length === 3) {
      specificRuleSet.add(`${parts[0]} ${parts[1]}.${parts[2]}`.replace(/[a-z]$/i, '').trim());
    } else if (parts.length === 2) {
      specificRuleSet.add(`${parts[0]} ${parts[1]}`);
    }
  }

  if (/\bsch(?:edule)?\s*1\b/i.test(queryText)) {
    specificRuleSet.add('sch 1');
  }
  const specificRules = Array.from(specificRuleSet);

  // Direct Qdrant rule fetch: If query explicitly names specific rules (e.g. FIT 2.1.3G, PRIN 2.1.1, SYSC 4),
  // directly retrieve those exact rule chunks from Qdrant to guarantee 100% recall regardless of conversational phrasing.
  if (rawRuleMatches.length > 0) {
    try {
      const qdrant = getQdrantClient();
      const collectionName = env.QDRANT_COLLECTION_NAME;
      const regexClone = new RegExp(rulePattern.source, 'gi');
      let match;
      while ((match = regexClone.exec(queryText)) !== null) {
        const parts = match[0].trim().split(/\s+/);
        const sb = parts[0];
        const rawNum = parts.slice(1).join(' ');
        const numOnly = rawNum ? rawNum.replace(/[a-zA-Z]/g, '').trim() : '';

        const filterMust = [];
        if (sb) filterMust.push({ key: 'title', match: { value: sb.toUpperCase() } });
        if (numOnly) filterMust.push({ key: 'ruleCode', match: { text: numOnly } });

        if (filterMust.length > 0) {
          const directRes = await qdrant.scroll(collectionName, {
            filter: { must: filterMust },
            limit: 20,
            with_payload: true
          });
          for (const p of directRes?.points || []) {
            if (!semanticResults.some((ex) => ex.id === p.id)) {
              // High starting base score for exact rule code hits
              semanticResults.push({ id: p.id, score: 0.65, payload: p.payload });
            }
          }
        }
      }
    } catch (directErr) {
      console.warn('⚠️ Direct rule scroll error (non-fatal, continuing with vector candidates):', directErr.message);
    }
  }

  // Extract standalone sourcebook codes (e.g. "PRIN", "FIT", "SYSC", "COCON")
  const standaloneSourcebooks = Array.from(new Set((queryText.match(SOURCEBOOKS_REGEX) || []).map((s) => s.toLowerCase())));

  // Multi-sourcebook combined query support (e.g. "What is the difference between FIT and COCON")
  const embeddingModel = getEmbeddingModel();
  if (standaloneSourcebooks.length > 1 && embeddingModel) {
    for (const sb of standaloneSourcebooks) {
      try {
        const sbVec = await embeddingModel.embedQuery(`${sb} regulatory rules requirements`);
        const sbRes = await searchRuleVectors(sbVec, limit * 2);
        for (const item of sbRes) {
          if (!semanticResults.some((ex) => ex.id === item.id)) {
            semanticResults.push(item);
          }
        }
      } catch (_) {}
    }
  }

  const stem = (w) => w.toLowerCase().replace(/(ing|tion|tions|ers|ed|es|s)$/g, '');

  // Comprehensive English stop words so generic functional words never bias keyword ranking
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
    'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing',
    'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
    'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'if', 'in', 'into',
    'is', 'it', 'its', 'itself', 'just', 'may', 'me', 'might', 'more', 'most',
    'must', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'our', 'ours', 'out', 'over', 'own', 'same', 'shall',
    'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
    'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
    'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
    'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours',
    'firm', 'firms'
  ]);

  const queryTokens = qLower
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  for (const sb of standaloneSourcebooks) {
    if (!queryTokens.includes(sb)) queryTokens.push(sb);
  }

  const candidates = semanticResults;
  if (candidates.length === 0) return [];

  // Detect top sections and internal cross-references from the top-scoring semantic candidates
  const sectionCounts = {};
  const crossRefRules = new Set();
  for (const item of candidates.slice(0, 6)) {
    const sec = item.payload?.sectionTitle;
    if (sec) sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;

    // Scan for internal citations such as "FIT 2.1.3 G" or "PRIN 2A.4.1"
    const text = item.payload?.content || '';
    const refs = text.match(/\b(?:CONC|FIT|PRIN|SYSC|COBS|MCOB|SUP|CASS|GEN|DISP|COCON)\s*[0-9]+(?:\.[0-9]+[A-Z0-9]*)*(?:\s*[A-Z])?\b/gi) || [];
    for (const ref of refs) {
      crossRefRules.add(ref.toLowerCase().replace(/\s+/g, ' '));
    }
  }

  const topSections = Object.keys(sectionCounts).sort((a, b) => sectionCounts[b] - sectionCounts[a]);
  const primarySection = topSections[0] || '';

  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 4. Score candidates with hybrid weighting
  const scored = candidates.map((item) => {
    const payload = item.payload || {};
    const content = (payload.content || '').toLowerCase();
    const ruleCode = (payload.ruleCode || '').toLowerCase().replace(/\s+/g, ' ');
    const ruleCodeNorm = norm(ruleCode);
    const sectionTitle = (payload.sectionTitle || '').toLowerCase();
    const sectionTitleNorm = norm(sectionTitle);
    const docTitle = (payload.title || '').toLowerCase();
    const fullText = `${content} ${ruleCode} ${sectionTitle} ${docTitle}`;

    let hybridScore = item.score || 0;
    let hasExactRuleMatch = false;
    let hasSourcebookMatch = false;

    // Specific rule code match boost with normalized alphanumeric matching
    for (const rm of rawRuleMatches) {
      const rmNorm = norm(rm);
      const rmNumNorm = norm(rm.replace(/^[a-z]+\s*/i, ''));
      const rmNumStripped = norm(rmNumNorm.replace(/[a-z]$/i, ''));

      // Exact rule match (e.g. "FIT 2.1.3 G" matches "FIT 2.1.3G" or "fit213g")
      if (ruleCodeNorm === rmNorm || ruleCodeNorm.includes(rmNorm)) {
        hybridScore += 15.0;
        hasExactRuleMatch = true;
      } else if (rmNumStripped && ruleCodeNorm.includes(rmNumStripped)) {
        hybridScore += 10.0;
        hasExactRuleMatch = true;
      } else if (sectionTitleNorm.includes(rmNorm) || (rmNumStripped && sectionTitleNorm.includes(rmNumStripped))) {
        hybridScore += 6.0;
        hasExactRuleMatch = true;
      }
    }

    // Secondary fallback for general prefix rules
    for (const sr of specificRules) {
      const srNorm = norm(sr);
      if (!hasExactRuleMatch && srNorm && (ruleCodeNorm.includes(srNorm) || sectionTitleNorm.includes(srNorm))) {
        hybridScore += 3.5;
        hasExactRuleMatch = true;
      }
    }

    // Sourcebook match boost (case-insensitive)
    for (const sb of standaloneSourcebooks) {
      if (docTitle === sb || docTitle.includes(sb) || ruleCode.startsWith(sb) || ruleCode.includes(sb)) {
        hybridScore += 2.0;
        hasSourcebookMatch = true;
      }
    }

    // Section co-retrieval boost: keep clauses belonging to the primary section together (for thematic general searches)
    if (rawRuleMatches.length === 0 && primarySection && payload.sectionTitle === primarySection) {
      hybridScore += 1.5;
    }

    // Cross-reference expansion boost: only apply once, and only for general thematic searches
    if (rawRuleMatches.length === 0) {
      let hasCrossRef = false;
      for (const cr of crossRefRules) {
        if (ruleCode.includes(cr) || (cr.length > 4 && ruleCode.includes(cr.slice(0, 7)))) {
          hasCrossRef = true;
          break;
        }
      }
      if (hasCrossRef) {
        hybridScore += 2.0;
      }
    }

    // Demote table of contents pages or broad multi-rule summaries so specific substantive clauses are prioritized
    if (content.includes('table of contents') || (ruleCode.split(',').length > 3 && rawRuleMatches.length > 0)) {
      hybridScore -= 3.0;
    }

    // Demote very short/empty chunks (e.g. bare section headers)
    if (content.length < 80) {
      hybridScore -= 1.5;
    }

    // Boost substantive Principles sections if query asks about principles
    if (qLower.includes('principle')) {
      if (ruleCode === 'prin 2.1.1' || (content.includes('1 integrity') && content.includes('skill, care'))) {
        hybridScore += 5.0;
      } else if (
        ruleCode.includes('prin 2.1') ||
        sectionTitle.includes('prin 2.1')
      ) {
        hybridScore += 3.5;
      } else if (ruleCode.includes('prin 2') && !ruleCode.includes('prin 2a')) {
        hybridScore += 1.5;
      }
    }

    // Substantive keyword matching with high-specificity discriminator weighting
    let keywordHits = 0;
    const itemWords = fullText.split(/[^a-z0-9]+/).map(stem);
    for (const token of queryTokens) {
      const tokenStem = stem(token);
      if (itemWords.includes(tokenStem) || itemWords.includes(token)) {
        keywordHits += 1;
        // High-specificity regulatory discriminators receive extra weighting
        if (['convict', 'crimin', 'offenc', 'fraud', 'dishonest', 'penalt', 'misconduct', 'disqualif', 'whistleblow', 'breach', 'investig'].some((k) => tokenStem.includes(k) || token.includes(k))) {
          hybridScore += 2.0;
        }
      }
    }

    if (queryTokens.length > 0) {
      hybridScore += (keywordHits / queryTokens.length) * 1.5;
    }

    return {
      ...item,
      hybridScore,
      hasExactRuleMatch,
      hasSourcebookMatch,
      keywordHits
    };
  });

  scored.sort((a, b) => b.hybridScore - a.hybridScore);

  // 5. Strict Relevance Thresholding calibrated for all-MiniLM-L6-v2:
  if (specificRules.length > 0 && !scored[0]?.hasExactRuleMatch && scored[0]?.keywordHits === 0) {
    return [];
  }

  // Refuse off-topic queries with 0 keyword hits, 0 sourcebook match, and low cosine score
  if (!scored[0]?.hasExactRuleMatch && !scored[0]?.hasSourcebookMatch && scored[0]?.keywordHits === 0 && (scored[0]?.score || 0) < 0.40) {
    return [];
  }

  // Filter candidates that have genuine relevance
  const filtered = scored.filter((c) => {
    if (c.hasExactRuleMatch) return true;
    if (c.hasSourcebookMatch) return true;
    if (c.keywordHits >= 2) return true;
    if (c.score >= 0.40 && c.keywordHits >= 1) return true;
    if (c.score >= 0.52) return true;
    return false;
  });

  // Deduplicate identical chunks by ID or substantive body content
  const seenIds = new Set();
  const seenBody = new Set();
  const deduplicated = [];
  for (const c of filtered) {
    if (seenIds.has(c.id)) continue;
    seenIds.add(c.id);

    // Strip metadata prefix [DOCUMENT: ...]\n[SECTION: ...]\n[RULE: ...] to compare substantive body text
    const substantiveBody = (c.payload?.content || '')
      .replace(/^(\[[^\]]+\]\s*)+/g, '')
      .slice(0, 150)
      .trim();

    if (!seenBody.has(substantiveBody)) {
      seenBody.add(substantiveBody);
      deduplicated.push(c);
    }
  }

  return deduplicated.slice(0, limit);
};

// Incremental Rule Diffing & Selective Updating Engine
export const applyIncrementalRuleDiff = async (document, newRawText, options = {}) => {
  if (!document || !newRawText) {
    throw new Error('Document and updated statutory text are required for incremental diffing.');
  }

  const docIdStr = document._id.toString();
  console.log(`🔍 [${document.title}] Starting incremental clause-level diff analysis...`);

  // 1. Fetch existing indexed points for this document from Qdrant
  const existingPoints = await getPointsByDocumentId(docIdStr);
  console.log(`📦 Found ${existingPoints.length} existing points in knowledge base for ${document.title}.`);

  // Build map of existing chunks by ruleCode & content fingerprint
  const existingMap = new Map();
  for (const pt of existingPoints) {
    const payload = pt.payload || {};
    const code = (payload.ruleCode || '').trim().toUpperCase();
    const hash = crypto.createHash('md5').update((payload.content || '').trim()).digest('hex');
    if (code) {
      existingMap.set(code, { id: pt.id, hash, payload });
    }
  }

  // 2. Parse new / amended text into semantic chunks
  const parsedNewChunks = splitFcaHandbookIntoSemanticChunks(newRawText, {
    title: document.title,
    authority: document.authority,
    category: document.category,
    ruleCode: document.ruleCode
  });

  if (parsedNewChunks.length === 0) {
    return {
      unchangedCount: existingPoints.length,
      modifiedCount: 0,
      addedCount: 0,
      totalPointsUpserted: 0,
      changesSummary: 'No rule changes detected in amended content.'
    };
  }

  const unchanged = [];
  const modified = [];
  const added = [];

  for (let i = 0; i < parsedNewChunks.length; i++) {
    const chunk = parsedNewChunks[i];
    const code = (chunk.ruleCode || '').trim().toUpperCase();
    const newHash = crypto.createHash('md5').update((chunk.content || '').trim()).digest('hex');

    if (code && existingMap.has(code)) {
      const existing = existingMap.get(code);
      if (existing.hash === newHash) {
        unchanged.push({ chunk, existingId: existing.id });
      } else {
        modified.push({ chunk, existingId: existing.id, oldContent: existing.payload.content });
      }
    } else {
      added.push({ chunk, idx: i });
    }
  }

  console.log(`📊 [${document.title}] Diff analysis: ${unchanged.length} unchanged, ${modified.length} modified, ${added.length} newly added.`);

  const embeddingModel = getEmbeddingModel();
  const pointsToUpsert = [];

  // 3. Re-embed ONLY modified chunks
  if (modified.length > 0) {
    const modifiedTexts = modified.map((m) => m.chunk.content);
    const modEmbeddings = await embeddingModel.embedDocuments(modifiedTexts);

    modified.forEach((m, idx) => {
      pointsToUpsert.push({
        id: m.existingId,
        vector: modEmbeddings[idx],
        payload: {
          documentId: docIdStr,
          title: document.title,
          authority: document.authority,
          category: document.category,
          ruleCode: m.chunk.ruleCode || document.ruleCode,
          sectionTitle: m.chunk.sectionTitle || '',
          ruleType: m.chunk.ruleType || 'Regulatory Clause',
          isSchedule: Boolean(m.chunk.isSchedule),
          version: document.version || '1.1',
          content: m.chunk.content,
          lastUpdated: new Date().toISOString()
        }
      });
    });
  }

  // 4. Embed ONLY newly added chunks
  if (added.length > 0) {
    const addedTexts = added.map((a) => a.chunk.content);
    const addEmbeddings = await embeddingModel.embedDocuments(addedTexts);

    added.forEach((a, idx) => {
      const globalIdx = existingPoints.length + idx;
      const idHash = crypto.createHash('md5').update(`${docIdStr}_chunk_${globalIdx}_${Date.now()}`).digest('hex');
      const pointId = `${idHash.slice(0, 8)}-${idHash.slice(8, 12)}-${idHash.slice(12, 16)}-${idHash.slice(16, 20)}-${idHash.slice(20, 32)}`;

      pointsToUpsert.push({
        id: pointId,
        vector: addEmbeddings[idx],
        payload: {
          documentId: docIdStr,
          title: document.title,
          authority: document.authority,
          category: document.category,
          ruleCode: a.chunk.ruleCode || document.ruleCode,
          sectionTitle: a.chunk.sectionTitle || '',
          ruleType: a.chunk.ruleType || 'Regulatory Clause',
          isSchedule: Boolean(a.chunk.isSchedule),
          version: document.version || '1.1',
          chunkIndex: globalIdx,
          content: a.chunk.content,
          lastUpdated: new Date().toISOString()
        }
      });
    });
  }

  // 5. Upsert only the changed/added points into Qdrant
  if (pointsToUpsert.length > 0) {
    await upsertRuleVectors(pointsToUpsert);
  }

  // 6. Generate an accurate AI diff summary using Groq
  let changesSummary = options.description || 'Statutory amendments and regulatory clarifications applied.';
  const changedItems = [...modified, ...added];
  if (changedItems.length > 0) {
    try {
      const groq = getGroqClient();
      const diffExcerpt = changedItems.slice(0, 4).map((c) => c.chunk.content).join('\n---\n');
      const diffPrompt = `Summarize these updated official UK financial regulatory clauses for a compliance team in 2 clear sentences. Mention the affected rule codes:
${diffExcerpt.slice(0, 2000)}`;

      const t0 = Date.now();
      const completion = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [{ role: 'user', content: diffPrompt }],
        temperature: 0.1
      });
      const dur = Date.now() - t0;
      changesSummary = completion.choices[0]?.message?.content || changesSummary;

      const usage = completion.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (promptTokens + completionTokens);

      if (totalTokens > 0) {
        try {
          await QueryHistory.create({
            userId: null,
            question: `[Rule Diff Analysis] ${document.title} incremental statutory diff`,
            answer: changesSummary,
            confidence: 'HIGH',
            model: env.GROQ_MODEL,
            purpose: 'Rule Diff Summary',
            promptTokens,
            completionTokens,
            totalTokens,
            durationMs: dur
          });
        } catch (_) {}
      }
    } catch (err) {
      console.warn('AI diff summary notice:', err.message);
    }
  }

  // 7. Update Document metadata & version in MongoDB
  const currentVerNum = parseFloat(document.version) || 1.0;
  const newVer = (currentVerNum + 0.1).toFixed(1);
  document.version = newVer;
  document.chunkCount = existingPoints.length + added.length;
  if (!document.metadata) document.metadata = {};
  document.metadata.lastSync = new Date().toISOString();
  document.metadata.changesSummary = changesSummary;
  await document.save();

  // 8. Broadcast compliance update notification to all employees
  if (changedItems.length > 0) {
    try {
      await Notification.create({
        recipientUserId: null,
        title: `FCA Regulatory Update: ${document.title} (v${newVer})`,
        message: `${modified.length} clauses updated, ${added.length} rules added. ${changesSummary}`,
        type: 'RULE_UPDATE',
        ruleDocumentId: document._id,
        changesSummary
      });
    } catch (notifErr) {
      console.warn('Notification broadcast warning:', notifErr.message);
    }
  }

  console.log(`✅ [${document.title}] Incremental sync complete: updated to v${newVer} with ${pointsToUpsert.length} vectors modified.`);

  return {
    documentId: document._id,
    title: document.title,
    ruleCode: document.ruleCode,
    version: newVer,
    unchangedCount: Math.max(0, existingPoints.length - modified.length),
    modifiedCount: modified.length,
    addedCount: added.length,
    totalPointsUpserted: pointsToUpsert.length,
    changesSummary
  };
};

