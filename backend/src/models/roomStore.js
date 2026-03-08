const rooms = new Map();

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function setRoom(roomId, room) {
  rooms.set(roomId, room);
  return room;
}

export function deleteRoom(roomId) {
  rooms.delete(roomId);
}

export function getAllRooms() {
  return Array.from(rooms.values());
}
