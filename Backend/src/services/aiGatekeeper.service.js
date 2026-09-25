import mongoose from 'mongoose';
import { getGroqClient } from './aiProvider.service.js';
import { promptCache } from './promptCache.service.js';
import { QueryHistory } from '../models/queryHistory.model.js';
import { env } from '../config/env.js';

// Extract stratified checkpoints across the document (Beginning, ~15% mark, ~50% mark, ~85% mark)
// This ensures whole-document authenticity without sending hundreds of pages to the LLM
export const extractStratifiedDocumentSample = (text) => {
  if (!text || text.length <= 4000) {
    return text || '';
  }

  const totalLen = text.length;

  // Checkpoint 1: Header & Publication Notice (Start / Pages 1-2)
  const headSample = text.slice(0, 1200).trim();

  // Checkpoint 2: Application Scope & General Rules (~15% mark)
  const earlyIdx = Math.floor(totalLen * 0.15);
  const earlySample = text.slice(earlyIdx, earlyIdx + 800).trim();

  // Checkpoint 3: Core Substantive Regulatory Standards (~50% mark)
  const midIdx = Math.floor(totalLen * 0.50);
  const midSample = text.slice(midIdx, midIdx + 800).trim();

  // Checkpoint 4: Schedules, Enforcement & Transitional Provisions (~85% mark)
  const lateIdx = Math.floor(totalLen * 0.85);
  const lateSample = text.slice(lateIdx, lateIdx + 800).trim();

  return `[CHECKPOINT 1: DOCUMENT COVER & TITLE (Start)]
${headSample}

---

[CHECKPOINT 2: APPLICATION & SCOPE RULES (~15% Mark)]
${earlySample}

---

[CHECKPOINT 3: SUBSTANTIVE REGULATORY PROVISIONS (~50% Mark)]
${midSample}

---

[CHECKPOINT 4: TRANSITIONAL & SCHEDULE CLAUSES (~85% Mark)]
${lateSample}`;
};

// AI Gatekeeper uses Groq LLM to verify if an uploaded document is a genuine UK Financial Regulatory Rule
const GATEKEEPER_INSTRUCTIONS = `You are an AI Gatekeeper for a UK Financial Regulatory AI platform.
Your job is to inspect the multi-point sample extracted across the uploaded document and determine whether it is an official or relevant UK Financial Regulatory document (e.g. published by or related to the Financial Conduct Authority [FCA], Prudential Regulation Authority [PRA], Bank of England [BoE], UK financial compliance rules, Consumer Duty, Senior Managers and Certification Regime [SM&CR], or UK financial statutes).

If the document is unrelated (e.g. a shopping list, resume, software manual, internal recipe, unrelated legal agreement, non-UK regulation), you MUST REJECT it.

Respond strictly in valid JSON format with no additional text:
{
  "isValidUKFinanceRule": true or false,
  "authority": "FCA" or "PRA" or "BOE" or "OTHER",
  "detectedRuleCodes": ["e.g. PRIN 2A", "SYSC 4"],
  "confidenceScore": 0.0 to 1.0,
  "reasoning": "A concise, clear 1-2 sentence explanation of why this document is accepted or rejected. If rejected, clearly identify what the document appears to be (e.g. technical manual, software guide, resume, invoice) and state that only official UK regulatory publications from FCA, PRA, or Bank of England are accepted. Do not mention internal jargon like 'sampled checkpoints'."
}`;

export const validateRegulatoryDocumentWithAI = async (text, fileName = '', options = {}) => {
  const startTime = Date.now();

  // Extract multi-point stratified sample across the entire document
  const excerpt = extractStratifiedDocumentSample(text);

  const prompt = `${GATEKEEPER_INSTRUCTIONS}

Analyze the following stratified checkpoint sample from the document "${fileName}":

--- DOCUMENT CHECKPOINT SAMPLES START ---
${excerpt}
--- DOCUMENT CHECKPOINT SAMPLES END ---`;

  const model = env.GROQ_MODEL;
  const cacheKey = promptCache.generateKey(model, GATEKEEPER_INSTRUCTIONS, excerpt, fileName);
  const cachedHit = await promptCache.get(cacheKey, fileName, model);

  if (cachedHit) {
    // ⚡ PROMPT CACHE HIT: 100% token savings & immediate return
    const cachedTokens = cachedHit.tokensSaved || (cachedHit.originalTokens?.totalTokens || 0);

    if (mongoose.connection.readyState === 1) {
      try {
        await QueryHistory.create({
          userId: options.userId || null,
          question: `[AI Gatekeeper Verification] File: ${fileName || 'Uploaded Document'}`,
          answer: `Result: ${cachedHit.isValidUKFinanceRule ? 'APPROVED' : 'REJECTED'}. Authority: ${cachedHit.authority || 'FCA'}. ${cachedHit.reasoning}`,
          confidence: cachedHit.isValidUKFinanceRule ? 'HIGH' : 'LOW',
          model,
          purpose: 'Document Gatekeeper',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          isCached: true,
          cachedTokens,
          durationMs: 3
        });
      } catch (logErr) {
        console.warn('Could not record cached Gatekeeper token metrics to MongoDB:', logErr.message);
      }
    }

    return {
      isValidUKFinanceRule: Boolean(cachedHit.isValidUKFinanceRule),
      authority: cachedHit.authority || 'FCA',
      detectedRuleCodes: Array.isArray(cachedHit.detectedRuleCodes) ? cachedHit.detectedRuleCodes : [],
      confidenceScore: typeof cachedHit.confidenceScore === 'number' ? cachedHit.confidenceScore : 0.95,
      reasoning: cachedHit.reasoning || 'Verification completed (Cached result).',
      isCached: true,
      cachedTokens,
      tokens: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cachedTokens, durationMs: 3 }
    };
  }

  const groq = getGroqClient();

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a strict compliance document verification assistant that only outputs valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const durationMs = Date.now() - startTime;
    const usage = completion.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);

    let content = completion.choices[0]?.message?.content || '{}';
    content = content.replace(/```json\s*|```\s*$/g, '').trim();

    const parsed = JSON.parse(content);

    // Store in Prompt Cache
    await promptCache.set(
      cacheKey,
      {
        isValidUKFinanceRule: Boolean(parsed.isValidUKFinanceRule),
        authority: parsed.authority || 'FCA',
        detectedRuleCodes: Array.isArray(parsed.detectedRuleCodes) ? parsed.detectedRuleCodes : [],
        confidenceScore: parsed.confidenceScore,
        reasoning: parsed.reasoning
      },
      { promptTokens, completionTokens, totalTokens },
      null,
      fileName,
      model
    );

    // Record token usage for Pre-Ingestion AI Gatekeeper
    if (mongoose.connection.readyState === 1 && totalTokens > 0) {
      try {
        await QueryHistory.create({
          userId: options.userId || null,
          question: `[AI Gatekeeper Verification] File: ${fileName || 'Uploaded Document'}`,
          answer: `Result: ${parsed.isValidUKFinanceRule ? 'APPROVED' : 'REJECTED'}. Authority: ${parsed.authority || 'FCA'}. ${parsed.reasoning}`,
          confidence: parsed.isValidUKFinanceRule ? 'HIGH' : 'LOW',
          model,
          purpose: 'Document Gatekeeper',
          promptTokens,
          completionTokens,
          totalTokens,
          isCached: false,
          cachedTokens: 0,
          durationMs
        });
      } catch (logErr) {
        console.warn('Could not record Gatekeeper token metrics to MongoDB:', logErr.message);
      }
    }

    return {
      isValidUKFinanceRule: Boolean(parsed.isValidUKFinanceRule),
      authority: parsed.authority || 'FCA',
      detectedRuleCodes: Array.isArray(parsed.detectedRuleCodes) ? parsed.detectedRuleCodes : [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.9,
      reasoning: parsed.reasoning || 'Verification completed.',
      isCached: false,
      tokens: { promptTokens, completionTokens, totalTokens, durationMs }
    };
  } catch (error) {
    console.warn('AI Gatekeeper Groq call error, running heuristic fallback:', error.message);
    // Heuristic fallback if LLM is temporarily unreachable
    const lower = excerpt.toLowerCase();
    const hasFCA = lower.includes('fca') || lower.includes('financial conduct authority');
    const hasPRA = lower.includes('pra') || lower.includes('prudential regulation');
    const hasRule = lower.includes('rule') || lower.includes('handbook') || lower.includes('compliance');

    if ((hasFCA || hasPRA) && hasRule) {
      return {
        isValidUKFinanceRule: true,
        authority: hasPRA ? 'PRA' : 'FCA',
        detectedRuleCodes: ['UK REG'],
        confidenceScore: 0.85,
        reasoning: 'Heuristic verified UK regulatory terminology and authority references.'
      };
    }

    return {
      isValidUKFinanceRule: false,
      authority: 'OTHER',
      detectedRuleCodes: [],
      confidenceScore: 0.3,
      reasoning: 'Document content does not appear to reference UK financial regulatory authorities or compliance rulebooks.'
    };
  }
};
