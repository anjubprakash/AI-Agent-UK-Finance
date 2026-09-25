import { apiClient } from './client.js';

export const regulatoryApi = {
  uploadDocument: (formData) =>
    apiClient.post('/regulatory-documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getUploadProgress: (uploadId) =>
    apiClient.get(`/regulatory-documents/upload-progress/${uploadId}`),
  updateRuleVersion: (id, formData) =>
    apiClient.post(`/regulatory-documents/${id}/update-version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getDocuments: (params) => apiClient.get('/regulatory-documents', { params }),
  getDocumentById: (id) => apiClient.get(`/regulatory-documents/${id}`),
  deleteDocument: (id) => apiClient.delete(`/regulatory-documents/${id}`),
  resetKnowledgeBase: () => apiClient.delete('/regulatory-documents/reset'),
  checkFcaUpdates: (refresh = false) =>
    apiClient.get('/regulatory-documents/fca/updates', { params: refresh ? { refresh: 'true' } : {} }),
  syncFcaRulebook: (data) => apiClient.post('/regulatory-documents/fca/sync', data),
};
