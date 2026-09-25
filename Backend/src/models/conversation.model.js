import mongoose from 'mongoose';

const citedRuleSchema = new mongoose.Schema({
  ruleTitle: { type: String, default: '' },
  authority: { type: String, default: 'FCA' },
  ruleCode: { type: String, default: '' },
  version: { type: String, default: '1.0' },
  contentSnippet: { type: String, default: '' },
  relevanceScore: { type: Number, default: 0 }
});

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  confidence: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'NOT_FOUND', 'DB_OFFLINE', 'ERROR'],
    default: 'HIGH'
  },
  citedRules: [citedRuleSchema],
  suggestedFollowUps: {
    type: [String],
    default: []
  },
  model: {
    type: String,
    default: 'openai/gpt-oss-120b'
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
  estimatedCostUsd: {
    type: Number,
    default: 0
  },
  isCached: {
    type: Boolean,
    default: false
  },
  cacheType: {
    type: String,
    default: null
  },
  semanticSimilarity: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Compliance Inquiry',
      trim: true
    },
    messages: [messageSchema],
    isPinned: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
