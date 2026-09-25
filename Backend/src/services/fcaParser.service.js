import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Clean running headers, footers, and page artifacts common in FCA Handbook PDFs
export const cleanFcaDocumentText = (rawText) => {
  if (!rawText) return '';

  let cleaned = rawText
    // Remove handbook URL lines and publication dates (e.g., www.handbook.fca.org.uk September 2026)
    .replace(/www\.handbook\.fca\.org\.uk[^\n]*/gi, '')
    .replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi, '')
    // Remove running page numbers and footers (e.g., "-- 1 of 86 --", "Page 1 of 86", "1 of 86")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, '')
    .replace(/^\s*\d+\s+of\s+\d+\s*$/gm, '')
    // Remove isolated dots or page break marker lines (e.g., .\n.\n.\n.)
    .replace(/^\s*\.\s*$/gm, '')
    // Remove isolated page header indicators like "CONC" or "FIT" on standalone lines
    .replace(/^(CONC|FIT|PRIN|SYSC|COBS|MCOB|SUP|CASS|GEN|DISP)\s*$/gm, '')
    // Join hyphenated words split across lines (e.g., credit-\nrelated -> credit-related)
    .replace(/(\w+)-\n(\w+)/g, '$1$2')
    // Normalize newlines and excessive whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
};

// Map rule type single letter to descriptive label
const getRuleTypeLabel = (codeType) => {
  switch (codeType?.toUpperCase()) {
    case 'R': return 'Rule (Binding Requirement)';
    case 'G': return 'Guidance (Regulatory Guidance)';
    case 'E': return 'Evidential Provision';
    case 'P': return 'Principle';
    case 'D': return 'Direction';
    default: return 'Regulatory Clause';
  }
};

/**
 * Advanced FCA Handbook Structure & Table Aware Chunking
 * Handles large sourcebook PDFs (e.g., CONC, FIT, PRIN, SYSC) by extracting:
 * 1. Sourcebook and Section titles
 * 2. Exact Rule Codes with provision type (R, G, E)
 * 3. Schedule tables and transitional matrices intact
 * 4. Context-injected chunks preserving hierarchical references across multi-page rules
 */
export const splitFcaHandbookIntoSemanticChunks = (rawText, docMetadata = {}) => {
  const text = cleanFcaDocumentText(rawText);
  const chunks = [];

  // Match Section boundaries like:
  // "Section : PRIN 2A.4 Fair value" or "Section : FIT 2.1 Honesty" or "Section : CONC 1.1"
  const sectionSplitRegex = /(?=Section\s*:\s*[A-Z]{2,8}\s*(?:[0-9]+[A-Z0-9]*(?:\.[0-9]+[A-Z0-9]*)*|TP\s*[0-9]+|Sch\s*[0-9]+))/gi;
  const sections = text.split(sectionSplitRegex);

  // If no FCA section markers were found, use robust paragraph chunker
  if (sections.length <= 1) {
    const rawBlocks = text.split(/\n\s*\n+/);
    const fallbackTexts = [];
    let cur = '';
    for (const b of rawBlocks) {
      if ((cur + '\n\n' + b).length > 1000) {
        if (cur) fallbackTexts.push(cur.trim());
        cur = b;
      } else {
        cur = cur ? cur + '\n\n' + b : b;
      }
    }
    if (cur.trim()) fallbackTexts.push(cur.trim());
    if (fallbackTexts.length === 0 && text.trim()) fallbackTexts.push(text.trim());

    return fallbackTexts.map((content, idx) => ({
      chunkIndex: idx,
      content: `[DOCUMENT: ${docMetadata.title || 'UK Regulatory Rule'}]\n\n${content}`,
      ruleCode: docMetadata.ruleCode || '',
      sectionTitle: 'General Provisions',
      ruleType: 'Regulatory'
    }));
  }

  let globalChunkIndex = 0;
  const MAX_CHUNK_SIZE = 1200;

  for (const sectionBlock of sections) {
    if (!sectionBlock.trim()) continue;

    // Extract section title
    const sectionMatch = sectionBlock.match(/Section\s*:\s*([^\n]+)/i);
    const sectionTitle = sectionMatch ? sectionMatch[1].trim() : 'FCA Handbook Section';
    const isSched = sectionTitle.toLowerCase().includes('sch') || sectionTitle.toLowerCase().includes('transitional');

    // Regex to detect individual rule boundaries (e.g. "\n PRIN 2A.4.1 R" or "\n FIT 2.1.3 G")
    const ruleBoundaryRegex = /(?=(?:^|\n)\s*(?:CONC|FIT|PRIN|SYSC|COBS|MCOB|SUP|CASS|GEN|DISP|COCON)\s*(?:[0-9]+[A-Z0-9]*(?:\.[0-9]+[A-Z0-9]*)*(?:-[0-9]+)?|TP\s*[0-9]+(?:\.[0-9]+)*|Sch\s*[0-9]+(?:\.[0-9]+)*)\s*(?:[R|G|E|P|D])?\b)/g;
    const ruleBlocks = sectionBlock.split(ruleBoundaryRegex);

    let pendingBlockContent = '';
    let pendingRuleCode = '';
    let pendingRuleType = '';

    const flushPending = () => {
      if (!pendingBlockContent.trim()) return;
      const contextPrefix = `[DOCUMENT: ${docMetadata.title || 'FCA Handbook'}]
[SECTION: ${sectionTitle}]
[RULE: ${pendingRuleCode || docMetadata.ruleCode || 'UK Rule'} (${pendingRuleType || 'Regulatory Clause'})]
`;
      chunks.push({
        chunkIndex: globalChunkIndex++,
        content: `${contextPrefix}\n${pendingBlockContent.trim()}`,
        ruleCode: pendingRuleCode || docMetadata.ruleCode || '',
        sectionTitle,
        ruleType: pendingRuleType || 'Regulatory Clause',
        isSchedule: isSched
      });
      pendingBlockContent = '';
      pendingRuleCode = '';
      pendingRuleType = '';
    };

    for (const block of ruleBlocks) {
      const trimmedBlock = block.trim();
      if (!trimmedBlock || trimmedBlock.length < 30) continue;

      // Detect rule code and type at start of block
      const ruleHeaderMatch = trimmedBlock.match(/\b([A-Z]{2,6})\s+([0-9]+[A-Z0-9]*(?:\.[0-9]+[A-Z0-9]*)*(?:-[0-9]+)?|TP\s*[0-9]+(?:\.[0-9]+)*|Sch\s*[0-9]+(?:\.[0-9]+)*)(?:\s+([R|G|E|P|D]))?\b/i);

      let ruleCode = '';
      let typeLabel = '';

      const validSourcebooks = [
        'PRIN', 'FIT', 'SYSC', 'COBS', 'DISP', 'CONC', 'MCOB', 'CASS', 'SUP', 'GEN',
        'COCON', 'BCOBS', 'ICOBS', 'MAR', 'PROD', 'LR', 'DTR', 'FEES', 'COMP', 'PRA', 'BOE'
      ];

      const detectedSource = ruleHeaderMatch ? ruleHeaderMatch[1].toUpperCase() : '';
      const isValidSource = validSourcebooks.includes(detectedSource) || (docMetadata.ruleCode && docMetadata.ruleCode.toUpperCase().includes(detectedSource));

      if (ruleHeaderMatch && isValidSource) {
        const sourcebook = detectedSource;
        const codeNum = ruleHeaderMatch[2];
        const ruleType = ruleHeaderMatch[3] ? ruleHeaderMatch[3].toUpperCase() : '';
        ruleCode = `${sourcebook} ${codeNum}${ruleType ? ' ' + ruleType : ''}`;
        typeLabel = getRuleTypeLabel(ruleType);
      } else {
        ruleCode = docMetadata.ruleCode || sectionTitle.split(' ')[0] || 'UK Rule';
        typeLabel = 'Regulatory Guidance';
      }

      if (trimmedBlock.length > MAX_CHUNK_SIZE) {
        flushPending();
        // Subdivide long rules by numbered items e.g. (1), (2), (a), (b)
        const subParts = trimmedBlock.split(/(?=\n\s*\([0-9]+\)|\n\s*\([a-z]\))/g);
        let currentSubChunk = '';
        for (const part of subParts) {
          if ((currentSubChunk + part).length > MAX_CHUNK_SIZE && currentSubChunk.length > 0) {
            const contextPrefix = `[DOCUMENT: ${docMetadata.title || 'FCA Handbook'}]
[SECTION: ${sectionTitle}]
[RULE: ${ruleCode} (${typeLabel})]
`;
            chunks.push({
              chunkIndex: globalChunkIndex++,
              content: `${contextPrefix}\n${currentSubChunk.trim()}`,
              ruleCode,
              sectionTitle,
              ruleType: typeLabel,
              isSchedule: false
            });
            currentSubChunk = part;
          } else {
            currentSubChunk += (currentSubChunk ? '\n' : '') + part;
          }
        }
        if (currentSubChunk.trim()) {
          const contextPrefix = `[DOCUMENT: ${docMetadata.title || 'FCA Handbook'}]
[SECTION: ${sectionTitle}]
[RULE: ${ruleCode} (${typeLabel})]
`;
          chunks.push({
            chunkIndex: globalChunkIndex++,
            content: `${contextPrefix}\n${currentSubChunk.trim()}`,
            ruleCode,
            sectionTitle,
            ruleType: typeLabel,
            isSchedule: false
          });
        }
      } else {
        // Coalesce smaller adjacent blocks in the same section
        if (pendingBlockContent.length + trimmedBlock.length > MAX_CHUNK_SIZE && pendingBlockContent.length > 0) {
          flushPending();
        }
        if (!pendingRuleCode) {
          pendingRuleCode = ruleCode;
          pendingRuleType = typeLabel;
        } else if (ruleCode && !pendingRuleCode.includes(ruleCode)) {
          pendingRuleCode += `, ${ruleCode}`;
        }
        pendingBlockContent += (pendingBlockContent ? '\n\n' : '') + trimmedBlock;
      }
    }
    flushPending();
  }

  return chunks;
};
