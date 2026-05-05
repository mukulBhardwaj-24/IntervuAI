import { apiRequest, withTimeout } from './api';

export async function getUserSubmissions(userId, limit = 20, skip = 0) {
  return withTimeout(
    apiRequest(`/api/submissions/${userId}?limit=${limit}&skip=${skip}`),
    10000
  );
}

export async function getSubmissionStats(userId) {
  return withTimeout(
    apiRequest(`/api/submissions/${userId}/stats`),
    10000
  );
}

export async function getSubmission(id) {
  return withTimeout(
    apiRequest(`/api/submissions/submission/${id}`),
    10000
  );
}
