import mongoose from 'mongoose';

const promptCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    normalizedQuery: {
      type: String,
      required: true,
      index: true
    },
    model: {
      type: String,
      default: 'openai/gpt-oss-120b'
    },
    answer: {
      type: String,
      required: true
    },
    confidence: {
      type: String,
      default: 'HIGH'
    },
    suggestedFollowUps: {
      type: [String],
      default: []
    },
    citedRules: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
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
    cachedTokens: {
      type: Number,
      default: 0
    },
    hitCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// TTL index to auto-expire entries after 14 days
promptCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

export const PromptCache = mongoose.model('PromptCache', promptCacheSchema);
