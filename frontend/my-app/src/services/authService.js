import { apiRequest, withTimeout } from './api';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK || 'true') === 'true';

const mockUser = {
  id: 'u1',
  name: 'Mukul Sharma',
  email: 'mukul@example.com'
};

function setMockSessionCookie() {
  document.cookie = `session=mock-jwt; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

function clearMockSessionCookie() {
  document.cookie = 'session=; path=/; max-age=0; SameSite=Lax';
}

function hasMockCookie() {
  return document.cookie.includes('session=mock-jwt');
}

// Always hit the real backend for register/login to ensure real auth flow
export async function register(payload) {
  const res = await withTimeout(apiRequest('/api/auth/register', { method: 'POST', body: payload }));

  if (res?.token) {
    try {
      localStorage.setItem('token', res.token);
    } catch (e) {
      // ignore localStorage write errors
    }
  }

  return res;
}

export async function login(payload) {
  const res = await withTimeout(apiRequest('/api/auth/login', { method: 'POST', body: payload }));

  if (res?.token) {
    try {
      localStorage.setItem('token', res.token);
    } catch (e) {
      // ignore localStorage write errors
    }
  }

  return res;
}

export async function getCurrentUser() {
  // If mock mode and no token present, keep mock behavior for bootstrap
  try {
    const token = localStorage.getItem('token');
    if (!token && USE_MOCK) {
      if (!hasMockCookie()) {
        throw new Error('Not authenticated');
      }

      return { user: mockUser };
    }
  } catch (e) {
    // ignore localStorage access errors and fallthrough to real backend
  }

  return withTimeout(apiRequest('/api/auth/me'));
}

export async function logout() {
  try {
    localStorage.removeItem('token');
  } catch (e) {
    // ignore
  }

  if (USE_MOCK) {
    clearMockSessionCookie();
    return { success: true };
  }

  return withTimeout(apiRequest('/api/auth/logout', { method: 'POST' }));
}
