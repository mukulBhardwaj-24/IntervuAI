import { apiRequest, withTimeout } from './api';

export async function runCode(language, source, stdin = '', problemId = null) {
  const payload = {
    language,
    source,
    stdin,
    problemId
  };
  
  return withTimeout(
    apiRequest('/api/run', {
      method: 'POST',
      body: payload
    }),
    15000
  );
}
