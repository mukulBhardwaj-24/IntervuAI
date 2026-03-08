import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom } from '../services/roomService';

function getClientUserId() {
  const key = 'ips-account-user-id';
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const generated = `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(key, generated);
  return generated;
}

function getParticipantId() {
  const key = 'ips-participant-id';
  const existing = window.sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const generated = `participant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.sessionStorage.setItem(key, generated);
  return generated;
}

export default function InterviewLobby() {
  const [roomInput, setRoomInput] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    setError('');
    setLoading(true);

    try {
      const payload = {
        userId: getClientUserId(),
        participantId: getParticipantId(),
        userName: userName.trim() || 'Host'
      };

      const room = await createRoom(payload);
      navigate(`/interview/${room.roomId}`, {
        state: {
          userId: payload.userId,
          participantId: payload.participantId,
          userName: payload.userName
        }
      });
    } catch (e) {
      setError(e.message || 'Could not create room');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(event) {
    event.preventDefault();
    setError('');

    if (!roomInput.trim()) {
      setError('Enter a room ID to join');
      return;
    }

    setLoading(true);

    try {
      const roomId = roomInput.trim().toUpperCase();
      const payload = {
        userId: getClientUserId(),
        participantId: getParticipantId(),
        userName: userName.trim() || 'Guest'
      };

      await joinRoom(roomId, payload);
      navigate(`/interview/${roomId}`, {
        state: {
          userId: payload.userId,
          participantId: payload.participantId,
          userName: payload.userName
        }
      });
    } catch (e) {
      setError(e.message || 'Could not join room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="fade-up" style={{ maxWidth: '720px', margin: '1rem auto' }}>
      <div className="card" style={{ padding: '1rem' }}>
        <h1 style={{ marginTop: 0 }}>Interview Lobby</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Create a room for your mock interview or join using a shared room id.
        </p>

        <label className="muted" htmlFor="lobby-name">
          Display Name
        </label>
        <input
          className="input"
          id="lobby-name"
          onChange={(event) => setUserName(event.target.value)}
          placeholder="e.g. Mukul"
          style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}
          value={userName}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          <article className="card" style={{ padding: '0.8rem', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0 }}>Create Room</h3>
            <p className="muted">Generate a live room ID from backend and enter instantly.</p>
            <button className="btn btn-primary" disabled={loading} onClick={handleCreate} type="button">
              {loading ? 'Creating...' : 'Create and Enter'}
            </button>
          </article>

          <article className="card" style={{ padding: '0.8rem', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0 }}>Join Room</h3>
            <form onSubmit={handleJoin}>
              <input
                className="input mono"
                disabled={loading}
                onChange={(event) => setRoomInput(event.target.value)}
                placeholder="e.g. A1B2C3"
                value={roomInput}
              />
              <button className="btn" disabled={loading} style={{ marginTop: '0.65rem' }} type="submit">
                {loading ? 'Joining...' : 'Join Interview'}
              </button>
            </form>
          </article>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', marginBottom: 0, marginTop: '0.75rem' }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
