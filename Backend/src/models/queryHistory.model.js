import mongoose from 'mongoose';

const citedRuleSchema = new mongoose.Schema({
  ruleTitle: { type: String, default: '' },
  authority: { type: String, default: 'FCA' },
  ruleCode: { type: String, default: '' },
  version: { type: String, default: '1.0' },
  contentSnippet: { type: String, default: '' },
  relevanceScore: { type: Number, default: 0 }
});

const queryHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true
    },
    citedRules: [citedRuleSchema],
    confidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'NOT_FOUND', 'DB_OFFLINE', 'ERROR'],
      default: 'HIGH'
    },
    suggestedFollowUps: {
      type: [String],
      default: []
    },
    model: {
      type: String,
      default: 'openai/gpt-oss-120b'
    },
    purpose: {
      type: String,
      default: 'Compliance Chat',
      index: true
    },
    promptTokens: {
      type: Number,
      default: 0
    },
    completionTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    isCached: {
      type: Boolean,
      default: false,
      index: true
    },
    cacheType: {
      type: String,
      default: null
    },
    semanticSimilarity: {
      type: String,
      default: null
    },
    cachedTokens: {
      type: Number,
      default: 0
    },
    estimatedCostUsd: {
      type: Number,
      default: 0
    },
    durationMs: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const QueryHistory = mongoose.model('QueryHistory', queryHistorySchema);
