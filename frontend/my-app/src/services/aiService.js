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
