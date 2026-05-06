const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export async function apiRequest(path, options = {}) {
  const config = {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  // Attach Authorization header when token is present in localStorage
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage errors in some environments
  }

  const response = await fetch(`${BASE_URL}${path}`, config);

  if (!response.ok) {
    let errorMessage = 'Request failed';

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      // Keep default message when body is not JSON.
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    })
  ]);
}
