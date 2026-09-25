import { Router } from 'express';
import {
  askAgent,
  getWidgetSession,
  clearWidgetSession,
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  getQueryHistory,
  getQueryById,
  getCostAnalysis
} from '../controllers/agent.controller.js';
import { authenticate, optionalAuthenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Ask questions about UK financial rules (Open to guests/widgets with optional auth, full session memory)
router.post('/query', optionalAuthenticate, askAgent);

// Embeddable Widget Session Restore & Reset
router.get('/widget/session/:widgetSessionId', getWidgetSession);
router.delete('/widget/session/:widgetSessionId', clearWidgetSession);

// Conversation management (authenticated users)
router.get('/conversations', authenticate, listConversations);
router.post('/conversations', authenticate, createConversation);
router.get('/conversations/:id', authenticate, getConversation);
router.patch('/conversations/:id', authenticate, updateConversation);
router.delete('/conversations/:id', authenticate, deleteConversation);

// View past questions and AI responses (legacy history)
router.get('/history', authenticate, getQueryHistory);
router.get('/history/:id', authenticate, getQueryById);

// Admin Cost & Token Analytics (Admin only)
router.get('/cost-analysis', authenticate, authorizeRoles('ADMIN'), getCostAnalysis);

export default router;
