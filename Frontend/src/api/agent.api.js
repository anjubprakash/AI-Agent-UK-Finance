import { apiClient } from './client.js';

export const agentApi = {
  queryAgent: (question, conversationId = null, conversationHistory = []) =>
    apiClient.post('/agent/query', { question, conversationId, conversationHistory }),
  listConversations: () => apiClient.get('/agent/conversations'),
  createConversation: (title) => apiClient.post('/agent/conversations', { title }),
  getConversation: (id) => apiClient.get(`/agent/conversations/${id}`),
  updateConversation: (id, data) => apiClient.patch(`/agent/conversations/${id}`, data),
  deleteConversation: (id) => apiClient.delete(`/agent/conversations/${id}`),
  getQueryHistory: () => apiClient.get('/agent/history'),
  getQueryById: (id) => apiClient.get(`/agent/history/${id}`),
  getCostAnalysis: (params = {}) => apiClient.get('/agent/cost-analysis', { params }),
};
