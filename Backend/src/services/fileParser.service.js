import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { ApiError } from '../utils/apiError.js';

// Calculate SHA-256 hash of a file for duplicate detection
export const calculateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

// Extract raw text from PDF or DOCX file
export const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const extracted = result.text || '';
      return cleanExtractedText(extracted);
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      const extracted = result.value || '';
      return cleanExtractedText(extracted);
    } else {
      throw ApiError.badRequest(`Unsupported file format: ${ext}`);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.badRequest(`Failed to parse document content: ${error.message}`);
  }
};

// Normalize extracted text
const cleanExtractedText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

