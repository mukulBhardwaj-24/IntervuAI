# Interview Prep System - Complete Learning Guide

This document is a full, practical guide for your `BTP` workspace. It explains what you built, how it works end-to-end, core concepts, edge cases, and where to learn each topic deeply.

## 1. What This Project Is

You are building an **Interview Prep System** with a focus on the **Interview Room** module:

- User A creates a room.
- User B joins the same room.
- Both can:
  - collaborate on code in real time,
  - chat in real time,
  - start camera/mic and do peer video chat (WebRTC signaling over Socket.IO).

Current status:

- Interview room integration is real (frontend + backend + MongoDB).
- Auth is still mock-based for now.

## 2. Repository Structure

- `frontend/my-app/` - React + Vite app
- `backend/` - Express + Socket.IO + MongoDB backend
- `README.md` (this file) - project + concept guide

## 3. Tech Stack and Why

### Frontend
- React (component UI and state)
- React Router (page routing)
- Fetch API wrapper (`src/services/api.js`) for REST calls
- Socket.IO client for real-time events
- WebRTC APIs for peer-to-peer audio/video

### Backend
- Node.js + Express for REST APIs
- Socket.IO for real-time messaging/signaling
- Mongoose + MongoDB for persistent room data

### Database
- MongoDB local (Docker container) + Compass for inspection

## 4. Core Concepts You Must Understand

## 4.1 REST vs WebSocket vs WebRTC

- REST (HTTP): request/response operations.
  - Example: create room, join room, fetch room details.
- WebSocket (Socket.IO): continuous bi-directional real-time channel.
  - Example: code updates, chat messages, user joined/left, signaling messages.
- WebRTC: direct browser-to-browser media connection.
  - Socket.IO is used only to exchange signaling data (`offer`, `answer`, `ice-candidate`).

In short:
- REST creates/joins the session.
- Socket keeps session live.
- WebRTC carries media.

## 4.2 Signaling Flow (Video)

1. Both clients join same room through socket.
2. One client starts media and creates `offer`.
3. Offer sent via socket to peer.
4. Peer sets remote description, creates `answer`, sends back.
5. Both exchange ICE candidates.
6. Peer connection stabilizes and media stream appears.

Important:
- Media stream is peer-to-peer.
- Socket server does not relay actual video frames.

## 4.3 Room Identity Model (Important for Tabs)

You need two IDs:

- `userId` (account identity): same across tabs for same logged-in account.
- `participantId` (tab/session identity): unique per tab instance.

Why?
- If same user opens two tabs, both are same account, but must be treated as two separate participants in room logic.

## 4.4 Why MongoDB Here

- Room state persists even if server restarts.
- You can inspect documents in Compass.
- Better than in-memory Map for multi-session demos.

## 5. Current Interview Room Flow (Your Implementation)

### REST API Flow
- `POST /api/rooms` -> create room (backend generates unique room ID)
- `POST /api/rooms/:roomId/join` -> join room as participant
- `GET /api/rooms/:roomId` -> fetch room state

### Socket Flow
- `join-room`
- `code-change` -> `code-updated`
- `send-message` -> `receive-message`
- `offer`/`answer`/`ice-candidate` for WebRTC
- `leave-room` and `disconnect` cleanup

### Persistence
Mongo `Room` document stores:
- `roomId`, `createdBy`
- `participants[]`
- `messages[]`
- `code`
- `isActive`

## 6. Setup and Run (Local)

## 6.1 MongoDB (Docker)

```bash
docker run -d --name ips-mongo -p 27017:27017 mongo:7
```

## 6.2 Backend

`backend/.env` should contain:

```env
PORT=5001
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/interview_prep_system
```

Run backend:

```bash
cd c:/Users/HP/OneDrive/Desktop/BTP/backend
npm install
npm start
```

## 6.3 Frontend

`frontend/my-app/.env` should contain:

```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_USE_MOCK=true
```

Run frontend:

```bash
cd c:/Users/HP/OneDrive/Desktop/BTP/frontend/my-app
npm install
npm run dev
```

## 6.4 Test in Two Clients

- Client A: create room.
- Copy exact generated room ID.
- Client B: join with same ID.
- Start video in both clients.

Tip: use different browsers (Chrome + Edge) for camera testing.

## 7. End-to-End Data Flow (Mental Model)

1. User clicks `Create and Enter`.
2. Frontend sends REST create call.
3. Backend creates room document in Mongo.
4. Frontend navigates to room page.
5. Frontend opens socket and emits `join-room`.
6. Backend validates participant and broadcasts room state.
7. Code edits/chat emit socket events and persist to Mongo.
8. Video start emits signaling events over socket and establishes WebRTC P2P.

## 8. Edge Cases and Handling

## 8.1 Room Join Errors
- Wrong room ID -> `404 Room not found`.
- Fix: join with exact generated room ID.

## 8.2 Room Full
- More than 2 participants -> `Room is full`.

## 8.3 Same Account in Two Tabs
- Must use unique `participantId` per tab.
- Shared `userId` is fine.

## 8.4 Port Mismatch
- Backend on `5001` but frontend calls `5000` -> API fails.
- Fix `.env` alignment and restart frontend dev server.

## 8.5 Stale Node Process on Same Port
- `EADDRINUSE` means another process already uses that port.
- Kill stale PID or change `PORT`.

## 8.6 WebRTC Not Connecting
- Camera/mic permission denied.
- Browser restriction or insecure origin.
- Network/firewall NAT issues.

## 8.7 Mongo Not Running
- Backend startup fails with DB connection error.
- Start Docker Mongo container first.

## 9. Debugging Checklist

When something fails, check in this order:

1. Is Mongo running on `27017`?
2. Is backend running and `/api/health` returns OK?
3. Is frontend env pointing to backend port?
4. Did you restart frontend after env change?
5. Are both clients joining exact same room ID?
6. Are socket events visible in browser devtools network/ws?
7. Are camera/mic permissions allowed?

Useful commands:

```bash
curl -s http://localhost:5001/api/health
"/c/Windows/System32/netstat.exe" -ano | "/c/Windows/System32/findstr.exe" :5001
```

## 10. Security and Production Notes

Current implementation is dev-focused. For production, add:

- Real auth/JWT middleware for room APIs and socket handshake.
- Input validation and rate limiting.
- HTTPS/WSS mandatory for stable WebRTC in production.
- TURN server for difficult NAT networks.
- Better room cleanup strategy and indexes.

## 11. Learning Roadmap (Recommended Order)

1. HTTP + REST basics
2. React state and routing
3. Socket.IO event-driven architecture
4. WebRTC offer/answer/ICE fundamentals
5. MongoDB schema design and Mongoose operations
6. Auth and session model
7. Production hardening

## 12. References (High Quality)

### React / Router
- React Docs: https://react.dev/
- React Router: https://reactrouter.com/

### Node / Express
- Node.js Docs: https://nodejs.org/docs/latest/api/
- Express Docs: https://expressjs.com/

### Socket.IO
- Official Docs: https://socket.io/docs/v4/

### WebRTC
- MDN WebRTC Overview: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- WebRTC Connectivity (ICE/STUN/TURN): https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
- webrtc/samples: https://github.com/webrtc/samples

### MongoDB / Mongoose
- MongoDB Manual: https://www.mongodb.com/docs/manual/
- Mongoose Docs: https://mongoosejs.com/docs/

### Docker
- Docker Get Started: https://docs.docker.com/get-started/
- Mongo Docker image: https://hub.docker.com/_/mongo

### System Design / Realtime Patterns
- Designing Event-Driven Systems (conceptual): https://www.oreilly.com/library/view/designing-event-driven-systems/9781492038252/
- High Scalability patterns: https://highscalability.com/

## 13. What To Build Next

1. Add real auth backend (`/api/auth/*`) and replace mock auth.
2. Add room invitation copy/share UX.
3. Wire `Run Code` and `Run Tests` to Judge0 from room panel.
4. Add reconnection and state recovery on temporary disconnect.
5. Add session history collection for analytics.

---

If you keep this README updated as you build, it becomes your final project documentation for evaluation.
