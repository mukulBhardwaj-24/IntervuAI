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

export async function register(payload) {
  if (USE_MOCK) {
    setMockSessionCookie();
    return { user: { ...mockUser, name: payload.name, email: payload.email } };
  }

  return withTimeout(apiRequest('/api/auth/register', { method: 'POST', body: payload }));
}

export async function login(payload) {
  if (USE_MOCK) {
    setMockSessionCookie();
    return { user: { ...mockUser, email: payload.email } };
  }

  return withTimeout(apiRequest('/api/auth/login', { method: 'POST', body: payload }));
}

export async function getCurrentUser() {
  if (USE_MOCK) {
    if (!hasMockCookie()) {
      throw new Error('Not authenticated');
    }

    return { user: mockUser };
  }

  return withTimeout(apiRequest('/api/auth/me'));
}

export async function logout() {
  if (USE_MOCK) {
    clearMockSessionCookie();
    return { success: true };
  }

  return withTimeout(apiRequest('/api/auth/logout', { method: 'POST' }));
}
