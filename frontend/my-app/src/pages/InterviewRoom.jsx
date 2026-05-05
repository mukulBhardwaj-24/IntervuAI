import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProblemList from '../components/problems/ProblemList';
import VideoPanel from '../components/room/VideoPanel';
import { getRoom } from '../services/roomService';
import { createSocketClient } from '../services/socketClient';
import { runCode } from '../services/runService';
import { aiChecklist, problems } from '../utils/mockData';
import './InterviewRoom.css';

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function getClientIdentity(locationState) {
  const userIdFromState = locationState?.userId;
  const participantIdFromState = locationState?.participantId;
  const userNameFromState = locationState?.userName;

  const storedUserId = window.localStorage.getItem('ips-account-user-id');
  const storedParticipantId = window.sessionStorage.getItem('ips-participant-id');

  if (!storedUserId) {
    const newUserId = `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem('ips-account-user-id', newUserId);
  }

  if (!storedParticipantId) {
    const newParticipantId = `participant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem('ips-participant-id', newParticipantId);
  }

  return {
    userId: userIdFromState || window.localStorage.getItem('ips-account-user-id'),
    participantId: participantIdFromState || window.sessionStorage.getItem('ips-participant-id'),
    userName: userNameFromState || 'Guest'
  };
}

function shouldInitiateOffer(participants, myParticipantId) {
  if (!participants || participants.length !== 2) {
    return false;
  }

  const ids = participants.map((item) => item.participantId || item.userId).sort();
  return ids[0] === myParticipantId;
}

export default function InterviewRoom() {
  const { roomId: routeRoomId } = useParams();
  const roomId = String(routeRoomId || '').toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();

  const identity = useMemo(() => getClientIdentity(location.state), [location.state]);

  const [selected, setSelected] = useState(problems[0]);
  const [participants, setParticipants] = useState([]);
  const [connectionState, setConnectionState] = useState('Connecting...');
  const [peerState, setPeerState] = useState('Idle');
  const [roomError, setRoomError] = useState('');
  const [language, setLanguage] = useState('python');

  const [code, setCode] = useState('// Shared code appears here\n');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');

  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);
  const [isRunLoading, setIsRunLoading] = useState(false);

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isVideoStartedRef = useRef(false);

  useEffect(() => {
    isVideoStartedRef.current = isVideoStarted;
  }, [isVideoStarted]);

  function stopLocalStream() {
    if (!localStreamRef.current) {
      return;
    }

    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }

  async function restoreCameraTrack() {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      const cameraTrack = localStreamRef.current?.getVideoTracks()?.[0];
      if (!cameraTrack) return;

      const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(cameraTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      setIsScreenSharing(false);
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    } catch {
      // swallow errors
    }
  }

  function closePeerConnection() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    pendingCandidatesRef.current = [];

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setPeerState('Idle');
  }

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const socket = socketRef.current;

    if (!socket) {
      return null;
    }

    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      socket.emit('ice-candidate', {
        roomId,
        candidate: event.candidate
      });
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setPeerState('Peer connected');
      } else if (pc.connectionState === 'connecting') {
        setPeerState('Connecting peer...');
      } else if (pc.connectionState === 'failed') {
        setPeerState('Peer failed');
      } else if (pc.connectionState === 'disconnected') {
        setPeerState('Peer disconnected');
      } else if (pc.connectionState === 'closed') {
        setPeerState('Peer closed');
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId]);

  async function ensureLocalStream() {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access is not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    setIsVideoStarted(true);
    setIsMicEnabled(true);
    setIsCamEnabled(true);
    setPeerState('Local media ready');

    return stream;
  }

  const createAndSendOffer = useCallback(async () => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    try {
      const pc = createPeerConnection();

      if (!pc) {
        return;
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('offer', {
        roomId,
        offer,
        fromUserId: identity.userId
      });

      setPeerState('Offer sent');
    } catch (error) {
      setRoomError(error.message || 'Could not create WebRTC offer');
    }
  }, [createPeerConnection, identity.userId, roomId]);

  const maybeStartOfferFlow = useCallback(async (participantsSnapshot) => {
    if (!isVideoStartedRef.current || participantsSnapshot.length < 2) {
      return;
    }

    if (!shouldInitiateOffer(participantsSnapshot, identity.participantId)) {
      return;
    }

    if (!peerConnectionRef.current) {
      await createAndSendOffer();
    }
  }, [createAndSendOffer, identity.participantId]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const room = await getRoom(roomId);

        if (!active) {
          return;
        }

        setParticipants(room.participants || []);
        setCode(room.code || '// Shared code appears here\n');
        setMessages(room.messages || []);
      } catch (error) {
        if (active) {
          setRoomError(error.message || 'Unable to fetch room details');
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    const socket = createSocketClient();
    socketRef.current = socket;

    const onConnect = () => {
      setConnectionState('Connected');
      setRoomError('');
      socket.emit('join-room', {
        roomId,
        userId: identity.userId,
        participantId: identity.participantId,
        userName: identity.userName
      });
    };

    const onConnectError = () => {
      setConnectionState('Connection error');
      setRoomError('Socket connection failed. Check backend server.');
    };

    const onDisconnect = () => {
      setConnectionState('Disconnected');
    };

    const onRoomState = (room) => {
      const roomParticipants = room.participants || [];
      setParticipants(roomParticipants);
      setCode(room.code || '// Shared code appears here\n');
      setMessages(room.messages || []);
      maybeStartOfferFlow(roomParticipants);
    };

    const onUserJoined = (user) => {
      setParticipants((prev) => {
        const exists = prev.some((item) => (item.participantId || item.userId) === (user.participantId || user.userId));
        const nextParticipants = exists ? prev : [...prev, user];
        maybeStartOfferFlow(nextParticipants);
        return nextParticipants;
      });
    };

    const onUserLeft = (user) => {
      setParticipants((prev) =>
        prev.filter((item) => (item.participantId || item.userId) !== (user.participantId || user.userId))
      );
      closePeerConnection();
    };

    const onCodeUpdated = (payload) => {
      setCode(payload.code || '');
    };

    const onMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const onRoomError = (payload) => {
      setRoomError(payload?.message || 'Room error');
    };

    const onOffer = async (payload = {}) => {
      try {
        await ensureLocalStream();

        const pc = createPeerConnection();

        if (!pc) {
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', {
          roomId,
          answer,
          fromUserId: identity.userId
        });

        setPeerState('Answer sent');
      } catch (error) {
        setRoomError(error.message || 'Failed to process incoming offer');
      }
    };

    const onAnswer = async (payload = {}) => {
      try {
        if (!peerConnectionRef.current) {
          return;
        }

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));

        for (const candidate of pendingCandidatesRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];

        setPeerState('Peer answered');
      } catch (error) {
        setRoomError(error.message || 'Failed to process answer');
      }
    };

    const onIceCandidate = async (payload = {}) => {
      const candidate = payload.candidate;

      if (!candidate) {
        return;
      }

      const pc = peerConnectionRef.current;

      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        setRoomError(error.message || 'Could not apply ICE candidate');
      }
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('room-state', onRoomState);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('code-updated', onCodeUpdated);
    socket.on('receive-message', onMessage);
    socket.on('room-error', onRoomError);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onIceCandidate);

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('room-state', onRoomState);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('code-updated', onCodeUpdated);
      socket.off('receive-message', onMessage);
      socket.off('room-error', onRoomError);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onIceCandidate);
      socket.disconnect();
      socketRef.current = null;
      closePeerConnection();
      stopLocalStream();
    };
  }, [createPeerConnection, identity.participantId, identity.userId, identity.userName, maybeStartOfferFlow, roomId]);

  useEffect(() => {
    return () => {
      closePeerConnection();
      stopLocalStream();
    };
  }, []);

  function handleCodeChange(nextCode) {
    setCode(nextCode);
    socketRef.current?.emit('code-change', { roomId, code: nextCode });
  }

  function handleSendMessage(event) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    socketRef.current?.emit('send-message', {
      roomId,
      message: draft.trim()
    });
    setDraft('');
  }

  async function handleRunCode() {
    setIsRunLoading(true);
    setRunError(null);
    setRunResult(null);

    try {
      const res = await runCode(language, code, '', selected?.id);
      setRunResult(res);
    } catch (err) {
      setRunError(err.message || 'Failed to run code');
    } finally {
      setIsRunLoading(false);
    }
  }

  async function handleStartVideo() {
    try {
      await ensureLocalStream();

      if (participants.length === 2 && shouldInitiateOffer(participants, identity.participantId)) {
        await createAndSendOffer();
      }
    } catch (error) {
      setRoomError(error.message || 'Could not start camera/microphone');
    }
  }

  async function handleShareScreen() {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser');
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];

      // show local preview of shared screen
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }

      screenStreamRef.current = displayStream;
      setIsScreenSharing(true);

      const pc = createPeerConnection();
      if (!pc) return;

      const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, displayStream);
      }

      // when user stops sharing, restore camera
      screenTrack.onended = () => {
        restoreCameraTrack();
      };
    } catch (error) {
      setRoomError(error.message || 'Could not start screen sharing');
    }
  }

  async function handleStartRecording() {
    try {
      if (isRecording) return;

      // prefer screen if sharing, else camera+mic
      const stream = screenStreamRef.current || localStreamRef.current;
      if (!stream) {
        throw new Error('No local media to record');
      }

      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm; codecs=vp9' };
      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        // create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);

        // upload to backend
        try {
          const form = new FormData();
          form.append('recording', blob, `recording-${Date.now()}.webm`);
          await fetch('/api/recordings/upload', { method: 'POST', body: form });
        } catch {
          // ignore upload errors for prototype
        }
      };

      mr.start(1000);
      setIsRecording(true);
    } catch (err) {
      setRoomError(err.message || 'Could not start recording');
    }
  }

  function handleStopRecording() {
    try {
      if (!mediaRecorderRef.current) return;
      mediaRecorderRef.current.stop();
    } finally {
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }

  function handleToggleMic() {
    if (!localStreamRef.current) {
      return;
    }

    const enabled = !isMicEnabled;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setIsMicEnabled(enabled);
  }

  function handleToggleCam() {
    if (!localStreamRef.current) {
      return;
    }

    const enabled = !isCamEnabled;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setIsCamEnabled(enabled);
  }

  function handleLeaveRoom() {
    navigate('/interview');
  }

  return (
    <section className="fade-up interview-room">
      <header className="card ir-topbar">
        <div className="ir-brand">
          <h1 className="mono ir-brand-title">Interview Prep System</h1>
          <span className="ir-badge">Room {roomId}</span>
          <span className={`ir-badge ${connectionState === 'Connected' ? 'is-live' : ''}`}>
            {connectionState}
          </span>
        </div>

        <div className="ir-badge-row">
          <span className="ir-badge">You: {identity.userName}</span>
          <span className="ir-badge">{participants.length}/2 in room</span>
          <button className="btn" onClick={handleLeaveRoom} type="button">EXIT</button>
        </div>
      </header>

      {roomError && (
        <p style={{ color: 'var(--danger)', margin: 0 }}>
          {roomError}
        </p>
      )}

      <div className="ir-main-grid">
        <aside className="card ir-problem-pane">
          <h3 className="ir-pane-title">{selected.title}</h3>
          <p className="mono muted" style={{ margin: 0, fontSize: '0.75rem' }}>
            {selected.difficulty} | {selected.tags.join(' | ')}
          </p>

          <div className="ir-problem-card">
            <p className="mono muted" style={{ margin: 0 }}>Statement</p>
            <p className="muted">{selected.statement}</p>
          </div>

          <div className="ir-problem-card">
            <p className="mono muted" style={{ margin: 0 }}>Sample Input</p>
            <p className="mono">{selected.sampleInput}</p>
            <p className="mono muted" style={{ marginTop: '0.5rem' }}>Sample Output</p>
            <p className="mono">{selected.sampleOutput}</p>
          </div>

          <h4 className="ir-pane-title" style={{ marginTop: '0.2rem' }}>Problem Picker</h4>
          <ProblemList items={problems} onSelect={setSelected} selectedId={selected.id} />
        </aside>

        <main className="card ir-code-pane">
          <div className="ir-code-tabs">
            <div className="ir-tab-list">
              <span className="ir-tab is-active">Coding 1</span>
              <span className="ir-tab">Coding 2</span>
              <span className="ir-tab">+</span>
            </div>
          </div>

          <div className="ir-code-toolbar">
            <select className="ir-select mono" onChange={(event) => setLanguage(event.target.value)} value={language}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <span className="mono muted" style={{ fontSize: '0.78rem' }}>Shared editor sync is live</span>
          </div>

          <div style={{ padding: '0.2rem 0.2rem 0 0.2rem' }}>
            <textarea
              className="mono ir-editor"
              onChange={(event) => handleCodeChange(event.target.value)}
              value={code}
            />
          </div>

          <div className="ir-action-row">
            <button 
              className="btn btn-primary" 
              onClick={handleRunCode}
              disabled={isRunLoading}
              type="button"
              style={{ opacity: isRunLoading ? 0.6 : 1, cursor: isRunLoading ? 'not-allowed' : 'pointer' }}
            >
              {isRunLoading ? '⏳ Running...' : '▶ Run Code'}
            </button>
            <button 
              className="btn" 
              type="button"
              disabled={isRunLoading}
              style={{ opacity: isRunLoading ? 0.6 : 1, cursor: isRunLoading ? 'not-allowed' : 'pointer' }}
            >
              Run Tests
            </button>
          </div>
        </main>

        <aside className="ir-side-pane">
          <section className="card ir-test-panel">
            <div className="ir-mini-tabs">
              <span className="ir-tab is-active">Output</span>
              <span className="ir-tab">History</span>
            </div>

            {runError && (
              <div className="ir-case" style={{ borderLeft: '4px solid #ef4444' }}>
                <p className="ir-case-header">
                  <span style={{ color: '#ef4444' }}>❌ Error</span>
                </p>
                <p className="mono muted" style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {runError}
                </p>
              </div>
            )}

            {runResult && (
              <>
                <div className="ir-case" style={{ borderLeft: `4px solid ${runResult.result?.status?.id === 3 ? '#4ade80' : '#fbbf24'}` }}>
                  <p className="ir-case-header">
                    <span>{runResult.result?.status?.description || 'Result'}</span>
                    <span style={{ 
                      color: runResult.result?.status?.id === 3 ? '#4ade80' : runResult.result?.status?.id === 4 ? '#ef4444' : '#fbbf24',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {runResult.result?.time ? `${runResult.result.time}s` : '—'}
                    </span>
                  </p>
                  {runResult.result?.stdout && (
                    <p className="mono" style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#b9ddff', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '4rem', overflow: 'auto' }}>
                      {runResult.result.stdout}
                    </p>
                  )}
                  {runResult.result?.stderr && (
                    <p className="mono" style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '2rem', overflow: 'auto' }}>
                      stderr: {runResult.result.stderr}
                    </p>
                  )}
                </div>
              </>
            )}

            {!runError && !runResult && (
              <>
                <div className="ir-case">
                  <p className="ir-case-header">
                    <span>Test Case 0</span>
                    <span className="muted">pending</span>
                  </p>
                </div>
                <div className="ir-case">
                  <p className="ir-case-header">
                    <span>Test Case 1</span>
                    <span style={{ color: 'var(--accent-strong)' }}>pending</span>
                  </p>
                </div>
              </>
            )}
          </section>

          <VideoPanel
            isCamEnabled={isCamEnabled}
            isMicEnabled={isMicEnabled}
            isVideoStarted={isVideoStarted}
            localVideoRef={localVideoRef}
            onStartVideo={handleStartVideo}
            onToggleCam={handleToggleCam}
            onToggleMic={handleToggleMic}
            peerState={peerState}
            remoteVideoRef={remoteVideoRef}
            onShareScreen={handleShareScreen}
            isScreenSharing={isScreenSharing}
            />

          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
            {!isRecording ? (
              <button className="btn" onClick={handleStartRecording} type="button">Start Recording</button>
            ) : (
              <button className="btn btn-danger" onClick={handleStopRecording} type="button">Stop Recording</button>
            )}
          </div>

          <section className="card ir-chat-panel">
            <div className="ir-chat-stream">
              {messages.map((item) => (
                <div key={item.id} className="ir-chat-item">
                  <p className="mono" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.userName}
                  </p>
                  <p className="mono" style={{ margin: '0.25rem 0 0', fontSize: '0.82rem' }}>
                    {item.message}
                  </p>
                </div>
              ))}
            </div>

            <form className="ir-chat-input-row" onSubmit={handleSendMessage}>
              <input
                className="input"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Send a message"
                value={draft}
              />
              <button className="btn btn-primary" type="submit">
                Send
              </button>
            </form>
          </section>

          <section className="card" style={{ padding: '0.75rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>AI Checklist</h3>
            <ul className="muted" style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.6, fontSize: '0.83rem' }}>
              {aiChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
