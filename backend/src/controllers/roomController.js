import { createRoom, getRoomDetails, joinRoom } from '../services/roomService.js';

export async function createRoomController(req, res, next) {
  try {
    const room = await createRoom(req.body || {});
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
}

export async function getRoomController(req, res, next) {
  try {
    const room = await getRoomDetails(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    return res.json(room);
  } catch (error) {
    return next(error);
  }
}

export async function joinRoomController(req, res, next) {
  try {
    const result = await joinRoom(req.params.roomId, req.body || {});
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
