import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

// token: optional JWT string to send to the server for socket auth
export function createSocketClient(token) {
  const opts = {
    transports: ['websocket'],
    withCredentials: true
  };

  if (token) {
    // socket.io v4 uses `auth` for initial auth payload
    opts.auth = { token };
  }

  return io(SOCKET_URL, opts);
}
