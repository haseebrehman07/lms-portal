import api from './axiosConfig';

export const chatService = {
  // Existing...
  getGroups: () => api.get('/chats/me'),
  getInvites: () => api.get('/chats/invites/me'),
  createGroup: (payload) => api.post('/chats', payload),
  inviteMembers: (groupId, emails, studentIds) => 
    api.post(`/chats/${groupId}/members`, { emails, student_ids: studentIds }),
  acceptInvite: (groupId) => api.post(`/chats/invites/${groupId}/accept`),
  declineInvite: (groupId) => api.post(`/chats/invites/${groupId}/decline`),
  getMessages: (groupId) => api.get(`/chats/${groupId}/messages`),
  sendMessage: (groupId, payload) => api.post(`/chats/${groupId}/messages`, payload),

  // NEW Endpoints for Group Info
  getGroupMembers: (groupId) => api.get(`/chats/${groupId}/members`),
  updateGroupName: (groupId, name) => api.patch(`/chats/${groupId}`, { name }),
  deleteGroup: (groupId) => api.delete(`/chats/${groupId}`),
  exitGroup: (groupId) => api.delete(`/chats/${groupId}/members/me`),
};

export default chatService;