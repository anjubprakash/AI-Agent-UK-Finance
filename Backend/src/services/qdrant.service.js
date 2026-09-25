import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env.js';

let client = null;
let isQdrantConnected = false;

export const getEmbeddingDimension = () => {
  return 384; // 384-dim dense vectors from Xenova/all-MiniLM-L6-v2 local engine
};

// Ensure every point has a valid float normalized vector matching targetDim so Qdrant never returns 422
export const ensureValidVector = (vec, text = '', dim = getEmbeddingDimension()) => {
  if (Array.isArray(vec) && vec.length === dim && vec.some((v) => v !== 0)) {
    return vec;
  }
  const vector = new Array(dim).fill(0);
  const src = text || 'uk_financial_regulatory_clause';
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i);
    vector[i % dim] = (vector[i % dim] + code / 255.0) % 1.0;
  }
  // Normalize vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((v) => v / norm);
};

export const getQdrantClient = () => {
  if (!client) {
    client = new QdrantClient({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY || undefined,
      checkCompatibility: false
    });
  }
  return client;
};

// Initialize the Qdrant collection for UK financial rules
// Initialize the Qdrant collection for UK financial rules
export const initQdrantCollection = async () => {
  const targetDim = getEmbeddingDimension();
  const qdrant = getQdrantClient();
  const collectionName = env.QDRANT_COLLECTION_NAME;

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (!exists) {
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: targetDim,
          distance: 'Cosine'
        }
      });
      console.log(`✅ Qdrant Collection '${collectionName}' created (${targetDim} dims for ${env.EMBEDDING_PROVIDER}).`);
    } else {
      const info = await qdrant.getCollection(collectionName);
      const existingSize = info?.config?.params?.vectors?.size;
      if (existingSize && existingSize !== targetDim) {
        console.log(`🔄 Upgrading Qdrant collection '${collectionName}' from ${existingSize} to ${targetDim} dimensions for ${env.EMBEDDING_PROVIDER}...`);
        await qdrant.deleteCollection(collectionName);
        await qdrant.createCollection(collectionName, {
          vectors: {
            size: targetDim,
            distance: 'Cosine'
          }
        });
        console.log(`✅ Qdrant Collection '${collectionName}' re-created with ${targetDim} dimensions.`);
      } else {
        console.log(`✅ Qdrant Collection '${collectionName}' is ready (${targetDim} dims, ${info?.points_count || 0} points).`);
      }
    }
    isQdrantConnected = true;
    return true;
  } catch (error) {
    isQdrantConnected = false;
    console.error(`❌ Qdrant Vector Database is OFFLINE or unreachable at ${env.QDRANT_URL}: ${error.message}`);
    console.error(`👉 Please ensure Docker Desktop is running and start the Qdrant container (e.g. docker run -p 6333:6333 qdrant/qdrant).`);
    return false;
  }
};

// Upsert vectors directly into Qdrant - fails explicitly if Qdrant is down
export const upsertRuleVectors = async (points) => {
  if (!points || points.length === 0) return 0;

  const qdrant = getQdrantClient();
  const collectionName = env.QDRANT_COLLECTION_NAME;

  const sanitizedPoints = points.map((p) => ({
    id: p.id,
    vector: ensureValidVector(p.vector, p.payload?.content || ''),
    payload: p.payload
  }));

  const BATCH_SIZE = 50;

  for (let i = 0; i < sanitizedPoints.length; i += BATCH_SIZE) {
    const batch = sanitizedPoints.slice(i, i + BATCH_SIZE);
    try {
      await qdrant.upsert(collectionName, {
        wait: true,
        points: batch
      });
      isQdrantConnected = true;
    } catch (err) {
      isQdrantConnected = false;
      const isConnError =
        err.message.includes('fetch failed') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('connect');

      const errorMsg = isConnError
        ? `Vector Database (Qdrant) is offline or unreachable at ${env.QDRANT_URL}. Please ensure Docker Desktop and the Qdrant container are running.`
        : `Qdrant vector upsert failed: ${err.message}`;

      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  console.log(`✅ Successfully upserted ${sanitizedPoints.length} points into Qdrant.`);
  return sanitizedPoints.length;
};

// Semantic vector search directly in Qdrant - fails explicitly if Qdrant is down
export const searchRuleVectors = async (queryVector, limit = 5) => {
  const qdrant = getQdrantClient();
  const collectionName = env.QDRANT_COLLECTION_NAME;
  const validQueryVec = ensureValidVector(queryVector, 'query');

  try {
    let rawPoints = [];
    if (typeof qdrant.query === 'function') {
      const queryRes = await qdrant.query(collectionName, {
        query: validQueryVec,
        limit,
        with_payload: true
      });
      rawPoints = queryRes?.points || [];
    } else if (typeof qdrant.search === 'function') {
      rawPoints = (await qdrant.search(collectionName, {
        vector: validQueryVec,
        limit,
        with_payload: true
      })) || [];
    }

    isQdrantConnected = true;
    return (rawPoints || []).map((res) => ({
      id: res.id,
      score: res.score,
      payload: res.payload
    }));
  } catch (err) {
    isQdrantConnected = false;
    const isConnError =
      err.message.includes('fetch failed') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('connect');

    const errorMsg = isConnError
      ? `Vector Database (Qdrant) is offline or unreachable at ${env.QDRANT_URL}. Please ensure Docker Desktop and the Qdrant container are running.`
      : `Qdrant vector search failed: ${err.message}`;

    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }
};

// Return total count of stored vectors directly from Qdrant
export const getStoredVectorCount = async () => {
  try {
    const qdrant = getQdrantClient();
    const info = await qdrant.getCollection(env.QDRANT_COLLECTION_NAME);
    isQdrantConnected = true;
    return info?.points_count || 0;
  } catch (err) {
    isQdrantConnected = false;
    const isConnError =
      err.message.includes('fetch failed') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('connect');

    if (isConnError) {
      throw new Error(`Vector Database (Qdrant) is offline or unreachable at ${env.QDRANT_URL}.`);
    }
    return 0;
  }
};

// Reset and clear all vectors from Qdrant directly
export const clearAllVectors = async () => {
  const targetDim = getEmbeddingDimension();
  const collectionName = env.QDRANT_COLLECTION_NAME;
  const qdrant = getQdrantClient();

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);
    if (exists) {
      await qdrant.deleteCollection(collectionName);
    }
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: targetDim,
        distance: 'Cosine'
      }
    });
    console.log(`🧹 Qdrant collection '${collectionName}' reset and re-created (${targetDim} dims).`);
    return true;
  } catch (err) {
    const errorMsg = `Failed to reset Qdrant collection: ${err.message}`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }
};

// Delete vectors associated with a specific regulatory document from Qdrant directly
export const deleteVectorsByDocumentId = async (docId) => {
  if (!docId) return;
  const strId = String(docId);
  const collectionName = env.QDRANT_COLLECTION_NAME;
  const qdrant = getQdrantClient();

  try {
    await qdrant.delete(collectionName, {
      filter: {
        must: [
          {
            key: 'documentId',
            match: { value: strId }
          }
        ]
      }
    });
    console.log(`🗑️ Deleted Qdrant vectors for documentId: ${strId}`);
  } catch (err) {
    console.error(`⚠️ Qdrant vector deletion error for doc ${strId}:`, err.message);
    throw new Error(`Failed to delete vectors from Qdrant: ${err.message}`);
  }
};

// Retrieve existing points and payload for a specific regulatory document
export const getPointsByDocumentId = async (docId) => {
  if (!docId) return [];
  const qdrant = getQdrantClient();
  const collectionName = env.QDRANT_COLLECTION_NAME;
  try {
    const res = await qdrant.scroll(collectionName, {
      filter: {
        must: [
          { key: 'documentId', match: { value: String(docId) } }
        ]
      },
      limit: 2500,
      with_payload: true,
      with_vector: false
    });
    return res?.points || [];
  } catch (err) {
    console.warn(`Failed to scroll points for doc ${docId}:`, err.message);
    return [];
  }
};

// -------------------------------------------------------------
// SEMANTIC PROMPT CACHING (Dedicated Qdrant Collection)
// -------------------------------------------------------------
export const SEMANTIC_CACHE_COLLECTION = 'semantic_prompt_cache';

// Initialize Qdrant Collection for Semantic Prompt Cache
export const initSemanticCacheCollection = async () => {
  const targetDim = getEmbeddingDimension();
  const qdrant = getQdrantClient();
  const collectionName = SEMANTIC_CACHE_COLLECTION;

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (!exists) {
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: targetDim,
          distance: 'Cosine'
        }
      });
      console.log(`🧠 Qdrant Semantic Cache Collection '${collectionName}' created (${targetDim} dims, Cosine distance).`);
    } else {
      console.log(`🧠 Qdrant Semantic Cache Collection '${collectionName}' is ready.`);
    }
    return true;
  } catch (err) {
    console.warn('⚠️ Could not initialize Qdrant semantic cache collection:', err.message);
    return false;
  }
};

// Upsert a semantic prompt cache entry into Qdrant
export const upsertSemanticCachePoint = async (point) => {
  if (!point || !point.id || !point.vector) return false;

  const qdrant = getQdrantClient();
  const sanitizedPoint = {
    id: point.id,
    vector: ensureValidVector(point.vector, point.payload?.question || ''),
    payload: point.payload || {}
  };

  try {
    await qdrant.upsert(SEMANTIC_CACHE_COLLECTION, {
      wait: true,
      points: [sanitizedPoint]
    });
    return true;
  } catch (err) {
    console.warn('⚠️ Qdrant semantic cache upsert warning:', err.message);
    return false;
  }
};

// Search for semantically equivalent questions in Qdrant with cosine similarity threshold
export const searchSemanticCache = async (queryVector, scoreThreshold = 0.80, limit = 1) => {
  if (!queryVector) return [];

  const qdrant = getQdrantClient();
  const validVector = ensureValidVector(queryVector, 'semantic_query');

  try {
    let results = [];
    if (typeof qdrant.query === 'function') {
      const res = await qdrant.query(SEMANTIC_CACHE_COLLECTION, {
        query: validVector,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true
      });
      results = res?.points || [];
    } else if (typeof qdrant.search === 'function') {
      results = await qdrant.search(SEMANTIC_CACHE_COLLECTION, {
        vector: validVector,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true
      });
    }

    return results;
  } catch (err) {
    console.warn('⚠️ Qdrant semantic cache search notice:', err.message);
    return [];
  }
};


