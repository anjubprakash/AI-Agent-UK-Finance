import mongoose from 'mongoose';

const regulatoryDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    authority: {
      type: String,
      enum: ['FCA', 'PRA', 'BOE', 'OTHER'],
      default: 'FCA'
    },
    category: {
      type: String,
      required: [true, 'Regulatory category is required'],
      trim: true
    },
    ruleCode: {
      type: String,
      trim: true,
      default: ''
    },
    version: {
      type: String,
      default: '1.0'
    },
    isLatestVersion: {
      type: Boolean,
      default: true
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RegulatoryDocument',
      default: null
    },
    fileHash: {
      type: String,
      required: true
    },
    originalFileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    rawText: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['UPLOADED', 'PARSED', 'INDEXED', 'FAILED', 'SUPERSEDED'],
      default: 'UPLOADED'
    },
    chunkCount: {
      type: Number,
      default: 0
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: {
      type: Map,
      of: String,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const RegulatoryDocument = mongoose.model('RegulatoryDocument', regulatoryDocumentSchema);
