import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProblemList from '../components/problems/ProblemList';
import VideoPanel from '../components/room/VideoPanel';
import { getRoom } from '../services/roomService';
import { createSocketClient } from '../services/socketClient';
import { useAuth } from '../context/AuthContext';
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

  const auth = useAuth();
  const { user: authUser, isLoading: authLoading } = auth;

  const identity = useMemo(() => getClientIdentity(location.state), [location.state]);

  // prefer authenticated user id when available, but do not overwrite participantId
  const effectiveIdentity = useMemo(() => {
    const base = { ...identity };
    if (authUser && (authUser._id || authUser.id)) {
      base.userId = authUser._id || authUser.id;
    }
    return base;
  }, [identity, authUser]);

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
    // Do not start socket until auth bootstrap completes to avoid sending undefined IDs
    if (authLoading) {
      return undefined;
    }

    // include token from localStorage when present for backend socket auth
    let token = null;
    try {
      token = localStorage.getItem('token');
    } catch (e) {
      token = null;
    }

    const socket = createSocketClient(token);
    socketRef.current = socket;

    const onConnect = () => {
      setConnectionState('Connected');
      setRoomError('');

      // send both userId (real account id when available) and participantId (tab identity)
      socket.emit('join-room', {
        roomId,
        userId: effectiveIdentity.userId,
        participantId: effectiveIdentity.participantId,
        userName: effectiveIdentity.userName
      });
    };

    const onConnectError = () => {
      setConnectionState('Connection error');
      setRoomError('Connection failed. Please try again.');
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
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave-room', { roomId });
      }
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
  // include authLoading so we re-run when auth bootstrap completes
  }, [createPeerConnection, effectiveIdentity.participantId, effectiveIdentity.userId, effectiveIdentity.userName, maybeStartOfferFlow, roomId, authLoading]);

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
    <div className="ir-container">
      

      <div className="ir-session-bar">
  
        <div className="ir-session-right">
          <span>Room ID: {roomId}</span>
          <span className={`ir-status ${connectionState === 'Connected' ? 'connected' : ''}`}>Status: {connectionState}</span>
          <span>User: {identity.userName}</span>
          <button onClick={handleLeaveRoom} className="btn btn-exit">Exit</button>
        </div>
      </div>

      {roomError && <div className="ir-error-msg">{roomError}</div>}

      <main className="ir-workspace">
        {/* LEFT COLUMN: PROBLEM CONTEXT */}
        <aside className="ir-left">
          <h3 className="ir-prob-title truncate">{selected.title}</h3>
          <p className="ir-prob-meta">{selected.difficulty} • {selected.tags.join(' • ')}</p>

          <div className="ir-scroll-area">
            <section className="ir-section">
              <h4>Problem Statement</h4>
              <p>{selected.statement}</p>
            </section>

            <section className="ir-section">
              <h4>Sample Input</h4>
              <pre className="mono">{selected.sampleInput}</pre>
              <h4>Sample Output</h4>
              <pre className="mono">{selected.sampleOutput}</pre>
            </section>

            <section className="ir-section">
              <h4>All Problems</h4>
              <ProblemList items={problems} onSelect={setSelected} selectedId={selected.id} />
            </section>
          </div>
        </aside>

        {/* CENTER COLUMN: CODE EDITOR */}
        <section className="ir-center">
          <div className="ir-editor-header">
            <select className="ir-select" onChange={(e) => setLanguage(e.target.value)} value={language}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <span className="ir-live-status">Live Sync</span>
            <span className="ir-peer-status">{peerState}</span>
          </div>

          <textarea
            className="ir-editor"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck="false"
          />

          <div className="ir-editor-footer">
            <button className="btn" type="button" onClick={handleRunCode} disabled={isRunLoading}>
              {isRunLoading ? 'Running…' : 'Run'}
            </button>
            <button className="btn btn-primary" type="button">Submit</button>
          </div>
        </section>

        {/* RIGHT COLUMN: VIDEO & CHAT */}
        <aside className="ir-right">
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

          <section className="ir-chat-section">
            <div className="ir-chat-header">Shared Chat</div>
            <div className="ir-chat-messages">
              {messages.map((item) => (
                <div key={item.id} className="ir-msg">
                  <div className="ir-msg-user">{item.userName}</div>
                  <div className="ir-msg-text">{item.message}</div>
                </div>
              ))}
            </div>
            <form className="ir-chat-form" onSubmit={handleSendMessage}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="ir-chat-input"
              />
              <button className="btn btn-primary" type="submit">Send</button>
            </form>
          </section>
        </aside>
      </main>
    </div>
  );
}
