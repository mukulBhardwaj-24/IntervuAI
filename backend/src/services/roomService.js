import { Room } from '../models/Room.js';
import { generateRoomId } from '../utils/roomId.js';

const MAX_PARTICIPANTS = 2;

function normalizeName(name, fallback) {
  const trimmed = String(name || '').trim();
  return trimmed || fallback;
}

function serializeRoom(room) {
  if (!room) {
    return null;
  }

  const source = typeof room.toObject === 'function' ? room.toObject() : room;

  return {
    roomId: source.roomId,
    createdBy: source.createdBy,
    participants: source.participants || [],
    isActive: source.isActive,
    createdAt: source.createdAt,
    code: source.code || '',
    messages: (source.messages || []).slice(-50)
  };
}

export async function createRoom(payload = {}) {
  let roomId = generateRoomId();

  while (await Room.exists({ roomId })) {
    roomId = generateRoomId();
  }

  const creatorName = normalizeName(payload.userName, 'Host');
  const creatorId = payload.userId || `account-${Date.now()}`;
  const participantId = payload.participantId || `participant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const room = await Room.create({
    roomId,
    createdBy: creatorId,
    participants: [{ participantId, userId: creatorId, userName: creatorName }],
    code: '',
    messages: [],
    isActive: true
  });

  return serializeRoom(room);
}

export async function getRoomDetails(roomId) {
  const normalizedRoomId = String(roomId || '').toUpperCase();
  const room = await Room.findOne({ roomId: normalizedRoomId, isActive: true });
  return serializeRoom(room);
}

export async function joinRoom(roomId, payload = {}) {
  const normalizedRoomId = String(roomId || '').toUpperCase();
  const room = await Room.findOne({ roomId: normalizedRoomId, isActive: true });

  if (!room || !room.isActive) {
    const error = new Error('Room not found');
    error.status = 404;
    throw error;
  }

  const userName = normalizeName(payload.userName, 'Guest');
  const userId = payload.userId || `account-${Date.now()}`;
  const participantId = payload.participantId || `participant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const existing = room.participants.find((person) => person.participantId === participantId);

  if (existing) {
    return { room: serializeRoom(room), user: { participantId, userId, userName } };
  }

  if (room.participants.length >= MAX_PARTICIPANTS) {
    const error = new Error('Room is full');
    error.status = 400;
    throw error;
  }

  const user = { participantId, userId, userName };
  room.participants.push(user);
  await room.save();

  return { room: serializeRoom(room), user };
}

export async function leaveRoom(roomId, participantId) {
  const normalizedRoomId = String(roomId || '').toUpperCase();
  const room = await Room.findOne({ roomId: normalizedRoomId, isActive: true });

  if (!room) {
    return null;
  }

  room.participants = room.participants.filter((person) => person.participantId !== participantId);

  if (room.participants.length === 0) {
    await Room.deleteOne({ roomId: normalizedRoomId });
    return null;
  }

  await room.save();
  return serializeRoom(room);
}

export async function updateSharedCode(roomId, code) {
  const normalizedRoomId = String(roomId || '').toUpperCase();
  const room = await Room.findOneAndUpdate(
    { roomId: normalizedRoomId, isActive: true },
    { $set: { code: String(code || '') } },
    { new: true }
  );

  return serializeRoom(room);
}

export async function addMessage(roomId, payload = {}) {
  const normalizedRoomId = String(roomId || '').toUpperCase();
  const room = await Room.findOne({ roomId: normalizedRoomId, isActive: true });

  if (!room) {
    return null;
  }

  const text = String(payload.message || '').trim();

  if (!text) {
    return null;
  }

  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: payload.userId || 'unknown',
    userName: normalizeName(payload.userName, 'Guest'),
    message: text,
    timestamp: new Date().toISOString()
  };

  room.messages.push(message);

  if (room.messages.length > 50) {
    room.messages = room.messages.slice(-50);
  }

  await room.save();

  return message;
}
