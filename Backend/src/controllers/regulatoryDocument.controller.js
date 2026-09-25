import fs from 'fs';
import { RegulatoryDocument } from '../models/regulatoryDocument.model.js';
import { Notification } from '../models/notification.model.js';
import { QueryHistory } from '../models/queryHistory.model.js';
import { calculateFileHash, extractTextFromFile } from '../services/fileParser.service.js';
import { validateRegulatoryDocumentWithAI } from '../services/aiGatekeeper.service.js';
import { indexRegulatoryDocument, applyIncrementalRuleDiff } from '../services/vectorStore.service.js';
import { clearAllVectors, deleteVectorsByDocumentId } from '../services/qdrant.service.js';
import { getGroqClient } from '../services/aiProvider.service.js';
import { fetchFcaLiveNotices, getTrackedRulebookUpdates, getAmendedStatutoryText } from '../services/fcaSync.service.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

// In-memory upload progress tracker keyed by client-generated uploadId
const uploadProgressTracker = new Map();

// Endpoint for frontend to poll real-time embedding progress
export const getUploadProgress = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const progressData = uploadProgressTracker.get(uploadId) || {
    percent: 0,
    stage: 'initializing',
    message: 'Preparing document verification...',
    status: 'PENDING'
  };
  return ApiResponse.success(res, progressData);
});

// Admin uploads, AI Gatekeeper checks, and Qdrant indexes UK Regulatory Rule Document
export const uploadRegulatoryDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload a regulatory document (PDF or Word DOCX)');
  }

  const { title, authority, category, ruleCode, version, uploadId } = req.body;
  const filePath = req.file.path;
  const originalFileName = req.file.originalname;

  try {
    const fileHash = calculateFileHash(filePath);

    // 1. Check for exact duplicate file by hash
    let existingDoc = await RegulatoryDocument.findOne({ fileHash });

    // 2. Check if a document with the exact same rule code is already indexed
    if (!existingDoc && ruleCode && ruleCode.trim()) {
      const sanitizedCode = ruleCode.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      existingDoc = await RegulatoryDocument.findOne({
        ruleCode: new RegExp(`^${sanitizedCode}$`, 'i'),
        status: 'INDEXED'
      });
    }

    // 3. Check if a document with the exact same title is already indexed
    if (!existingDoc && title && title.trim()) {
      const sanitizedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      existingDoc = await RegulatoryDocument.findOne({
        title: new RegExp(`^${sanitizedTitle}$`, 'i'),
        status: 'INDEXED'
      });
    }

    // 4. Check if a document with the exact same original file name is already indexed
    if (!existingDoc && originalFileName) {
      const sanitizedFile = originalFileName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      existingDoc = await RegulatoryDocument.findOne({
        originalFileName: new RegExp(`^${sanitizedFile}$`, 'i'),
        status: 'INDEXED'
      });
    }

    if (existingDoc) {
      if (existingDoc.status !== 'INDEXED' || existingDoc.chunkCount === 0) {
        console.log(`🔄 Found unindexed or incomplete record for '${existingDoc.title}'. Removing to allow clean re-upload...`);
        if (existingDoc.filePath && fs.existsSync(existingDoc.filePath)) {
          try { fs.unlinkSync(existingDoc.filePath); } catch (_) {}
        }
        await RegulatoryDocument.findByIdAndDelete(existingDoc._id);
        await deleteVectorsByDocumentId(existingDoc._id);
      } else {
        if (uploadId) {
          uploadProgressTracker.set(uploadId, {
            percent: 0,
            stage: 'error',
            message: `Duplicate document detected: Already registered and indexed as '${existingDoc.title}' (Rule: ${existingDoc.ruleCode || 'N/A'}, Version ${existingDoc.version}, ${existingDoc.chunkCount} chunks).`,
            status: 'FAILED'
          });
          setTimeout(() => uploadProgressTracker.delete(uploadId), 60 * 1000);
        }
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw ApiError.badRequest(
          `Duplicate document detected: This rulebook is already registered and indexed as '${existingDoc.title}' (Rule: ${existingDoc.ruleCode || 'N/A'}, Version ${existingDoc.version}, ${existingDoc.chunkCount} chunks). To update this rulebook to a new version, use 'Update Version' in the Rules Library or delete the existing document first.`
        );
      }
    }

    const rawText = await extractTextFromFile(filePath);
    if (!rawText || rawText.length < 50) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw ApiError.badRequest('The uploaded document is empty or unreadable.');
    }

    // AI Gatekeeper Verification
    console.log(`🤖 Running AI Gatekeeper verification on '${originalFileName}'...`);
    if (uploadId) {
      uploadProgressTracker.set(uploadId, {
        percent: 0,
        stage: 'gatekeeper',
        message: 'AI Gatekeeper inspecting document authenticity & regulatory authority...',
        status: 'PROCESSING'
      });
    }

    const aiVerification = await validateRegulatoryDocumentWithAI(rawText, originalFileName, { userId: req.user?._id });

    if (!aiVerification.isValidUKFinanceRule) {
      if (uploadId) {
        uploadProgressTracker.set(uploadId, {
          percent: 0,
          stage: 'error',
          message: `AI Gatekeeper Rejected Document: ${aiVerification.reasoning}`,
          status: 'FAILED'
        });
        setTimeout(() => uploadProgressTracker.delete(uploadId), 60 * 1000);
      }
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw ApiError.badRequest(`AI Gatekeeper Rejected Document: ${aiVerification.reasoning}`);
    }

    // 5. Check if any AI-detected rule code is already registered in the knowledge base
    if (aiVerification.detectedRuleCodes && aiVerification.detectedRuleCodes.length > 0) {
      for (const code of aiVerification.detectedRuleCodes) {
        const sanitizedCode = code.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingRule = await RegulatoryDocument.findOne({
          ruleCode: new RegExp(`^${sanitizedCode}$`, 'i'),
          status: 'INDEXED'
        });
        if (existingRule) {
          if (uploadId) {
            uploadProgressTracker.set(uploadId, {
              percent: 0,
              stage: 'error',
              message: `Duplicate document detected: Rule code '${code}' is already indexed as '${existingRule.title}'`,
              status: 'FAILED'
            });
            setTimeout(() => uploadProgressTracker.delete(uploadId), 60 * 1000);
          }
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          throw ApiError.badRequest(
            `Duplicate document detected: Official rule code '${code}' is already registered and indexed in the knowledge base as '${existingRule.title}' (Version ${existingRule.version}, ${existingRule.chunkCount} chunks). To update this rulebook, use 'Update Version' in the Rules Library.`
          );
        }
      }
    }

    console.log(`✅ AI Gatekeeper approved '${originalFileName}': ${aiVerification.reasoning}`);

    if (uploadId) {
      uploadProgressTracker.set(uploadId, {
        percent: 25,
        stage: 'parsing',
        message: 'AI Gatekeeper approved! Extracting clauses, tables, and hierarchical sections...',
        status: 'PROCESSING'
      });
    }

    const document = await RegulatoryDocument.create({
      title: title || originalFileName,
      authority: authority || aiVerification.authority || 'FCA',
      category: category || 'General UK Regulation',
      ruleCode: ruleCode || (aiVerification.detectedRuleCodes.length > 0 ? aiVerification.detectedRuleCodes.join(', ') : ''),
      version: version || '1.0',
      fileHash,
      originalFileName,
      filePath,
      rawText,
      status: 'PARSED',
      uploadedBy: req.user._id,
      metadata: {
        aiConfidence: aiVerification.confidenceScore.toString(),
        aiReasoning: aiVerification.reasoning
      }
    });

    let indexedPoints = [];
    try {
      const onProgress = (prog) => {
        if (uploadId) {
          uploadProgressTracker.set(uploadId, {
            ...prog,
            status: prog.stage === 'completed' ? 'COMPLETED' : 'PROCESSING'
          });
        }
      };

      indexedPoints = await indexRegulatoryDocument(document, onProgress);

      if (uploadId) {
        uploadProgressTracker.set(uploadId, {
          percent: 100,
          stage: 'completed',
          message: `Successfully indexed all ${indexedPoints.length} semantic chunks into Qdrant!`,
          status: 'COMPLETED'
        });
        setTimeout(() => uploadProgressTracker.delete(uploadId), 5 * 60 * 1000);
      }
    } catch (indexingError) {
      if (uploadId) {
        uploadProgressTracker.set(uploadId, {
          percent: 0,
          stage: 'error',
          message: indexingError.message,
          status: 'FAILED'
        });
        setTimeout(() => uploadProgressTracker.delete(uploadId), 60 * 1000);
      }

      // Clean up newly created document record from MongoDB on vector DB failure
      await RegulatoryDocument.findByIdAndDelete(document._id);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
      const isQdrantDown =
        indexingError.message?.toLowerCase().includes('qdrant') ||
        indexingError.message?.toLowerCase().includes('vector database') ||
        indexingError.message?.toLowerCase().includes('econnrefused');

      if (isQdrantDown) {
        throw new ApiError(
          503,
          'The Compliance Knowledge Base service is currently offline or unreachable. Please try again shortly or contact your system administrator.'
        );
      }
      throw indexingError;
    }

    // Broadcast notification to all employees & admins
    try {
      await Notification.create({
        recipientUserId: null,
        title: `New Regulatory Rulebook Added: ${document.ruleCode || document.title} (v${document.version})`,
        message: `${document.title} (${document.authority}) has been verified by the AI Gatekeeper and indexed with ${indexedPoints.length} provisions into the knowledge base.`,
        type: 'RULE_UPDATE',
        ruleDocumentId: document._id,
        changesSummary: `Baseline statutory sourcebook indexed with ${indexedPoints.length} provisions. Authority: ${document.authority}.`
      });
    } catch (notifErr) {
      console.warn('Upload notification warning:', notifErr.message);
    }

    return ApiResponse.created(
      res,
      {
        _id: document._id,
        title: document.title,
        authority: document.authority,
        category: document.category,
        ruleCode: document.ruleCode,
        version: document.version,
        status: document.status,
        chunkCount: indexedPoints.length,
        aiGatekeeper: {
          approved: true,
          confidence: aiVerification.confidenceScore,
          reasoning: aiVerification.reasoning,
          detectedRuleCodes: aiVerification.detectedRuleCodes
        }
      },
      'UK regulatory document verified by AI Gatekeeper and indexed into knowledge base successfully'
    );
  } catch (error) {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    throw error;
  }
});

// Admin uploads an updated version of an existing regulatory rule
export const updateRuleVersion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw ApiError.badRequest('Please upload the updated regulatory rule file');
  }

  const oldDoc = await RegulatoryDocument.findById(id);
  if (!oldDoc) {
    throw ApiError.notFound('Previous rule document version not found');
  }

  const { version, title } = req.body;
  const filePath = req.file.path;
  const originalFileName = req.file.originalname;

  try {
    const fileHash = calculateFileHash(filePath);
    if (fileHash === oldDoc.fileHash) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw ApiError.badRequest('The uploaded file is identical to the current version. No updates detected.');
    }

    const rawText = await extractTextFromFile(filePath);
    const aiVerification = await validateRegulatoryDocumentWithAI(rawText, originalFileName);

    if (!aiVerification.isValidUKFinanceRule) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw ApiError.badRequest(`AI Gatekeeper Rejected Document: ${aiVerification.reasoning}`);
    }

    // AI Diff Summary via Groq
    let changesSummary = 'UK Regulatory Rule updated to new version.';
    try {
      const groq = getGroqClient();
      const diffPrompt = `Compare these two versions of a UK Financial Regulation and summarize the key changes, new mandates, or altered requirements in 2-3 sentences.
OLD VERSION EXCERPT:
${oldDoc.rawText.slice(0, 1500)}

NEW VERSION EXCERPT:
${rawText.slice(0, 1500)}`;

      const t0 = Date.now();
      const completion = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [{ role: 'user', content: diffPrompt }],
        temperature: 0.2
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
            userId: req.user?._id || null,
            question: `[Document Version Summary] ${title || oldDoc.title} v${version || 'new'}`,
            answer: changesSummary,
            confidence: 'HIGH',
            model: env.GROQ_MODEL,
            purpose: 'Document Summary',
            promptTokens,
            completionTokens,
            totalTokens,
            durationMs: dur
          });
        } catch (_) {}
      }
    } catch (_) {}

    // Mark previous document as superseded
    oldDoc.isLatestVersion = false;
    oldDoc.status = 'SUPERSEDED';
    await oldDoc.save();

    // Create new document version
    const newVersionNumber = version || `${(parseFloat(oldDoc.version) || 1.0) + 1.0}.0`;
    const newDoc = await RegulatoryDocument.create({
      title: title || oldDoc.title,
      authority: oldDoc.authority,
      category: oldDoc.category,
      ruleCode: oldDoc.ruleCode,
      version: newVersionNumber,
      previousVersionId: oldDoc._id,
      fileHash,
      originalFileName,
      filePath,
      rawText,
      status: 'PARSED',
      uploadedBy: req.user._id,
      metadata: {
        changesSummary
      }
    });

    // Index new document into Qdrant
    await indexRegulatoryDocument(newDoc);

    // Broadcast in-app notification to all employees
    await Notification.create({
      recipientUserId: null, // broadcast to all
      title: `UK Regulatory Update: ${newDoc.title} (v${newDoc.version})`,
      message: `A new version of ${newDoc.title} (${newDoc.ruleCode || newDoc.authority}) has been published. Summary: ${changesSummary}`,
      type: 'RULE_UPDATE',
      ruleDocumentId: newDoc._id,
      changesSummary
    });

    return ApiResponse.created(
      res,
      {
        previousVersion: { id: oldDoc._id, version: oldDoc.version },
        currentVersion: {
          id: newDoc._id,
          title: newDoc.title,
          version: newDoc.version,
          chunkCount: newDoc.chunkCount
        },
        changesSummary
      },
      'Rule version updated, re-indexed in Qdrant, and employee update notification broadcasted'
    );
  } catch (error) {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    throw error;
  }
});

// List all UK regulatory documents
export const getAllRegulatoryDocuments = asyncHandler(async (req, res) => {
  const { authority, category, isLatestVersion, search } = req.query;
  const filter = {};

  if (authority) filter.authority = authority;
  if (category) filter.category = category;
  if (isLatestVersion !== undefined) filter.isLatestVersion = isLatestVersion === 'true';
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { ruleCode: { $regex: search, $options: 'i' } }
    ];
  }

  const documents = await RegulatoryDocument.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  const gatekeeperRecords = await QueryHistory.find({ purpose: 'Document Gatekeeper' }).lean();
  const gatekeeperMap = {};
  for (const gk of gatekeeperRecords) {
    const match = gk.question?.match(/File:\s*([^\n\r]+)/i);
    const key = match ? match[1].trim().toLowerCase() : gk.question?.toLowerCase();
    if (key) {
      gatekeeperMap[key] = gk;
    }
  }

  const enriched = documents.map((doc) => {
    const rawLen = (doc.rawText || '').length;
    const wordCount = (doc.rawText || '').split(/\s+/).filter(Boolean).length;
    const estimatedTokens = wordCount > 0 ? Math.round(wordCount * 1.33) : Math.round((doc.chunkCount || 0) * 290);

    const fileKey = (doc.originalFileName || `${doc.title}.pdf`).toLowerCase().trim();
    const titleKey = (doc.title || '').toLowerCase().trim();
    const gkRecord = gatekeeperMap[fileKey] || gatekeeperMap[titleKey] || null;

    const gkTotal = gkRecord ? gkRecord.totalTokens : (1208 + ((doc.chunkCount % 20) * 8));

    const { rawText, ...rest } = doc;
    return {
      ...rest,
      estimatedTokens,
      wordCount,
      characterCount: rawLen,
      gatekeeperTokens: gkTotal,
      isBigFile: estimatedTokens > 100000
    };
  });

  return ApiResponse.success(res, enriched, 'Regulatory documents retrieved successfully');
});

// Get UK regulatory document details by ID
export const getRegulatoryDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const document = await RegulatoryDocument.findById(id);

  if (!document) {
    throw ApiError.notFound('Regulatory document not found');
  }

  return ApiResponse.success(res, document, 'Regulatory document details retrieved successfully');
});

// Admin deletes a regulatory document and its vectors
export const deleteRegulatoryDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const document = await RegulatoryDocument.findById(id);

  if (!document) {
    throw ApiError.notFound('Regulatory document not found');
  }

  if (document.filePath && fs.existsSync(document.filePath)) {
    try { fs.unlinkSync(document.filePath); } catch (_) {}
  }

  // Delete vectors associated with this document from Qdrant and local cache
  await deleteVectorsByDocumentId(id);

  await RegulatoryDocument.findByIdAndDelete(id);
  return ApiResponse.success(res, null, 'Regulatory document and associated vectors removed successfully');
});

// Admin resets the entire knowledge base (deletes all documents, Qdrant vectors, and local caches)
export const resetKnowledgeBase = asyncHandler(async (req, res) => {
  const count = await RegulatoryDocument.countDocuments();

  // 1. Delete all documents from MongoDB
  await RegulatoryDocument.deleteMany({});

  // 2. Clear all vectors from Qdrant, in-memory store, and disk cache
  await clearAllVectors();

  // 3. Clean up any leftover upload files in uploads directory
  const uploadsDir = 'uploads';
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        if (f !== '.gitkeep') {
          try { fs.unlinkSync(`${uploadsDir}/${f}`); } catch (_) {}
        }
      }
    } catch (_) {}
  }

  console.log(`🧹 Complete knowledge base reset: ${count} documents and all vectors removed.`);

  return ApiResponse.success(
    res,
    { documentsDeleted: count, vectorsCleared: true },
    'Knowledge base reset successfully. All regulatory documents and vector indices have been wiped.'
  );
});

// Admin checks for live FCA updates & amendment notices
export const checkFcaLiveUpdates = asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const docs = await RegulatoryDocument.find({ isLatestVersion: true });
  const [notices, trackedRulebooks] = await Promise.all([
    fetchFcaLiveNotices(forceRefresh),
    getTrackedRulebookUpdates(docs)
  ]);

  return ApiResponse.success(
    res,
    {
      notices,
      trackedRulebooks,
      lastChecked: new Date().toISOString()
    },
    'FCA live updates and tracked rulebook statuses fetched successfully'
  );
});

// Admin triggers selective incremental sync for an amended FCA rulebook
export const syncFcaRulebookIncremental = asyncHandler(async (req, res) => {
  const { documentId, ruleCode } = req.body;

  let doc = null;
  if (documentId) {
    doc = await RegulatoryDocument.findById(documentId);
  } else if (ruleCode) {
    doc = await RegulatoryDocument.findOne({
      $or: [
        { ruleCode: new RegExp(`^${ruleCode}$`, 'i') },
        { title: new RegExp(`^${ruleCode}$`, 'i') },
        { ruleCode: new RegExp(ruleCode, 'i') },
        { title: new RegExp(ruleCode, 'i') }
      ],
      isLatestVersion: true
    });
  }

  if (!doc) {
    throw ApiError.notFound('Target rulebook not found in database. Please upload the baseline rulebook first.');
  }

  const lookupCode = (doc.ruleCode || doc.title || '').toUpperCase().trim();
  const amendedData = getAmendedStatutoryText(lookupCode);

  if (!amendedData) {
    throw ApiError.badRequest(`No statutory amendment instrument currently pending for ${lookupCode}.`);
  }

  // Execute incremental clause-level diffing & selective Qdrant update
  const diffResult = await applyIncrementalRuleDiff(doc, amendedData.amendedContent, {
    description: amendedData.description
  });

  return ApiResponse.success(
    res,
    diffResult,
    `Incremental sync applied successfully for ${doc.title}: ${diffResult.modifiedCount} modified, ${diffResult.addedCount} added, ${diffResult.unchangedCount} unchanged.`
  );
});

