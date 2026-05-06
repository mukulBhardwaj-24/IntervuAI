// import socket.io-client from frontend's node_modules via package name
const { io } = await import('socket.io-client');

const API = process.env.API_URL || 'http://localhost:5002';
const ROOM_ID = process.env.ROOM_ID || 'G001';

async function login() {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testuser@example.com', password: 'password123' })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

try {
  console.log('Logging in...');
  const data = await login();
  const token = data.token;
  const userId = data.user?._id || data.user?.id;
  console.log('Got token for user:', userId);

  const participantId = `participant-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const socket = io(process.env.SOCKET_URL || 'http://localhost:5002', { transports: ['websocket'], auth: { token }, withCredentials: true });

  socket.on('connect', () => {
    console.log('Socket connected, id=', socket.id);
    socket.emit('join-room', { roomId: ROOM_ID, userId, participantId, userName: 'SocketTest' });
  });

  socket.on('connect_error', (err) => {
    console.error('Connect error:', err.message || err);
    process.exit(1);
  });

  socket.on('room-state', (room) => {
    console.log('Received room-state:', room.participants?.length, 'participants');
    socket.disconnect();
    process.exit(0);
  });

  socket.on('room-error', (e) => {
    console.error('Room error:', e);
    socket.disconnect();
    process.exit(1);
  });

  setTimeout(() => {
    console.error('Socket test timeout');
    socket.disconnect();
    process.exit(1);
  }, 15000);
} catch (err) {
  console.error('Test failed:', err.message || err);
  process.exit(1);
}
