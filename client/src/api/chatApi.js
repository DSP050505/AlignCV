import api from './axios';

export const chatApi = {
  sendMessage: (resume_id, message, conversation_history = []) =>
    api.post('/chat/message', { resume_id, message, conversation_history }),
  preview: (resume_id, message, conversation_history = []) =>
    api.post('/chat/preview', { resume_id, message, conversation_history }),
  apply: (resume_id, new_resume) =>
    api.post('/chat/apply', { resume_id, new_resume }),
};
