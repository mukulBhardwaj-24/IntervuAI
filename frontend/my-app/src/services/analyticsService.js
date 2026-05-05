import { apiRequest, withTimeout } from './api';

export async function getAnalytics() {
  return withTimeout(apiRequest('/api/analytics'), 10000);
}
