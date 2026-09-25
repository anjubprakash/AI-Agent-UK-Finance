import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null indicates a global broadcast to all employees
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['RULE_UPDATE', 'SYSTEM_ANNOUNCEMENT'],
      default: 'RULE_UPDATE'
    },
    ruleDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RegulatoryDocument',
      default: null
    },
    changesSummary: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);
