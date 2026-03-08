import { Server } from 'socket.io';
import {
  addMessage,
  getRoomDetails,
  joinRoom,
  leaveRoom,
  updateSharedCode
} from '../services/roomService.js';

export function registerSocketHandlers(httpServer, frontendUrl) {
  const io = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    function resolveRoomId(payload = {}) {
      return String(payload.roomId || socket.data.roomId || '').toUpperCase();
    }

    socket.on('join-room', async (payload = {}) => {
      const roomId = String(payload.roomId || '').toUpperCase();

      if (!roomId) {
        socket.emit('room-error', { message: 'Room ID is required' });
        return;
      }

      try {
        const { room, user } = await joinRoom(roomId, {
          userId: payload.userId,
          participantId: payload.participantId,
          userName: payload.userName
        });

        socket.data.roomId = roomId;
        socket.data.userId = user.userId;
        socket.data.participantId = user.participantId;
        socket.data.userName = user.userName;

        socket.join(roomId);
        socket.emit('room-state', room);
        socket.to(roomId).emit('user-joined', user);
      } catch (error) {
        socket.emit('room-error', { message: error.message || 'Failed to join room' });
      }
    });

    socket.on('code-change', async (payload = {}) => {
      const roomId = resolveRoomId(payload);

      if (!roomId) {
        return;
      }

      try {
        await updateSharedCode(roomId, payload.code || '');
        socket.to(roomId).emit('code-updated', {
          code: payload.code || '',
          userId: socket.data.userId || 'unknown'
        });
      } catch {
        socket.emit('room-error', { message: 'Unable to sync code right now' });
      }
    });

    socket.on('send-message', async (payload = {}) => {
      const roomId = resolveRoomId(payload);

      if (!roomId) {
        return;
      }

      try {
        const message = await addMessage(roomId, {
          message: payload.message,
          userId: socket.data.userId,
          userName: socket.data.userName
        });

        if (message) {
          io.to(roomId).emit('receive-message', message);
        }
      } catch {
        socket.emit('room-error', { message: 'Unable to send message right now' });
      }
    });

    socket.on('offer', (payload = {}) => {
      const roomId = resolveRoomId(payload);

      if (!roomId) {
        return;
      }

      socket.to(roomId).emit('offer', { ...payload, roomId });
    });

    socket.on('answer', (payload = {}) => {
      const roomId = resolveRoomId(payload);

      if (!roomId) {
        return;
      }

      socket.to(roomId).emit('answer', { ...payload, roomId });
    });

    socket.on('ice-candidate', (payload = {}) => {
      const roomId = resolveRoomId(payload);

      if (!roomId) {
        return;
      }

      socket.to(roomId).emit('ice-candidate', { ...payload, roomId });
    });

    socket.on('leave-room', async (payload = {}) => {
      const roomId = resolveRoomId(payload);
      const participantId = socket.data.participantId;
      const userId = socket.data.userId;
      const userName = socket.data.userName;

      if (!roomId || !participantId) {
        return;
      }

      socket.leave(roomId);
      await leaveRoom(roomId, participantId);
      socket.to(roomId).emit('user-left', { participantId, userId, userName });

      const room = await getRoomDetails(roomId);
      if (room) {
        io.to(roomId).emit('room-state', room);
      }
    });

    socket.on('disconnect', async () => {
      const { roomId, participantId, userId, userName } = socket.data;

      if (!roomId || !participantId) {
        return;
      }

      await leaveRoom(roomId, participantId);
      socket.to(roomId).emit('user-left', { participantId, userId, userName });

      const room = await getRoomDetails(roomId);
      if (room) {
        io.to(roomId).emit('room-state', room);
      }
    });
  });
}
