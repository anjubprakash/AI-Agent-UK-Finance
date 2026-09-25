import { Router } from 'express';
import {
  askAgent,
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

// Ask questions about UK financial rules (Open to guests with optional auth, full session memory when logged in)
router.post('/query', optionalAuthenticate, askAgent);

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
