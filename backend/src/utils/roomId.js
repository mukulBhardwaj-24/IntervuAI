const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomId(size = 6) {
  let result = '';

  for (let i = 0; i < size; i += 1) {
    const index = Math.floor(Math.random() * ALPHABET.length);
    result += ALPHABET[index];
  }

  return result;
}
