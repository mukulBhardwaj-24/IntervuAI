import { apiRequest, withTimeout } from './api';

export function createRoom(payload = {}) {
  return withTimeout(
    apiRequest('/api/rooms', {
      method: 'POST',
      body: payload
    })
  );
}

export function getRoom(roomId) {
  return withTimeout(apiRequest(`/api/rooms/${roomId}`));
}

export function joinRoom(roomId, payload = {}) {
  return withTimeout(
    apiRequest(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      body: payload
    })
  );
}
