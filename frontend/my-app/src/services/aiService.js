import { apiRequest, withTimeout } from './api';

export async function requestHint(problemId, code) {
  return withTimeout(
    apiRequest('/api/ai/hint', {
      method: 'POST',
      body: { problemId, code }
    }),
    15000
  );
}

export async function requestReview(problemId, code) {
  return withTimeout(
    apiRequest('/api/ai/review', {
      method: 'POST',
      body: { problemId, code }
    }),
    20000
  );
}

export async function requestChat(roomId, code, userMessage) {
  return withTimeout(
    apiRequest('/api/ai/chat', {
      method: 'POST',
      body: { roomId, code, userMessage }
    }),
    30000
  );
}
