import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function createSocketClient() {
  return io(SOCKET_URL, {
    transports: ['websocket'],
    withCredentials: true
  });
}
