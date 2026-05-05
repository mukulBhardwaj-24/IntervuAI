# Interview Prep System - Setup & Run Guide

## Overview
This is a full-stack interview preparation platform with:
- **Frontend**: React (Vite) – problem list, code editor, practice workspace
- **Backend**: Node.js/Express – API endpoints, WebRTC signaling, code execution (Judge0), AI features (OpenAI)
- **Database**: MongoDB – submissions, users, analytics
- **Real-time**: Socket.IO – collaborative editor, video room signaling, chat

---

## Prerequisites

Ensure your office PC has:
- **Node.js** v18+ (download from https://nodejs.org/)
- **MongoDB** (either local installation or MongoDB Atlas cloud account)
- **Git** (for version control)
- A code editor (VS Code recommended)

Verify installation:
```bash
node --version
npm --version
mongo --version
```

---

## Project Structure

```
BTP/
├── backend/              # Express server, APIs, WebRTC signaling
│   ├── src/
│   ├── server.js         # Main server entry point
│   ├── package.json
│   └── uploads/          # Recordings stored here (auto-created)
├── frontend/my-app/      # React + Vite frontend
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Environment Setup

### Backend `.env` File

Create a file `backend/.env` with:

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/interview-prep
# or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview-prep

# Judge0 API (optional - for real code execution)
# Leave blank to use mock results during development
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_KEY=your_judge0_api_key_here
JUDGE0_RAPIDAPI_KEY=your_rapidapi_key_here
JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com

# OpenAI API (optional - for AI hints/reviews)
# Leave blank to use mock responses during development
OPENAI_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Server configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Node environment
NODE_ENV=development
```

### Frontend Environment

Frontend uses mock data and environment variables automatically. No `.env` file needed for local development.

---

## Installation & Startup

### Step 1: Install Backend Dependencies

```bash
cd BTP/backend
npm install
```

Expected output: `added X packages` with 0 vulnerabilities.

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend/my-app
npm install
```

Expected output: `added X packages`.

### Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
# Keep this terminal open; MongoDB will run on localhost:27017
```

**Option B: MongoDB Atlas Cloud**
- Create a cluster at https://www.mongodb.com/cloud/atlas
- Get connection string and set `MONGODB_URI` in `backend/.env`

### Step 4: Start Backend Server

Open a **new terminal** and run:

```bash
cd BTP/backend
npm run dev
# or for production: npm start
```

Expected output:
```
✓ Server listening on port 3001
✓ MongoDB connected
✓ Socket.IO ready
```

### Step 5: Start Frontend Dev Server

Open **another new terminal** and run:

```bash
cd BTP/frontend/my-app
npm run dev
```

Expected output:
```
VITE v7.3.1 ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## Access the Application

Open your browser and navigate to:

```
http://localhost:5173/
```

### Test Flows

1. **Home Page**: http://localhost:5173/
2. **Register/Login**: Create an account (auth uses localStorage in dev mode)
3. **Practice** (/practice):
   - View problem bank
   - Select a problem → opens code arena
   - Run code, get hints, request AI review
4. **Interview Room** (/interview):
   - Create/join room
   - Share code, video call (requires camera + mic permissions)
   - Screen share & record session
5. **Dashboard** (/dashboard):
   - View submission history
   - Platform analytics

---

## Mock Data & Fallbacks

During development, the system works **without external keys**:
- **Judge0**: Returns mock execution results (simulated output)
- **OpenAI**: Returns mock hints and code reviews
- **Problems**: Loads 60 mock problems from `frontend/src/utils/mockData.js`
- **Auth**: Uses browser localStorage (no real account backend)

To test with real APIs, add keys to `backend/.env`.

---

## Troubleshooting

### Port Already in Use
- Backend port 3001:
  ```bash
  # Kill process on port 3001
  lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
  ```
- Frontend port 5173:
  ```bash
  # Kill process on port 5173
  lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
  ```

### MongoDB Connection Fails
- Ensure MongoDB is running (`mongod` process)
- Check `MONGODB_URI` in `backend/.env`
- If using remote MongoDB Atlas, verify IP whitelist and connection string

### Frontend Won't Load
- Ensure backend is running on port 3001
- Check browser console (F12) for errors
- Try `npm run build && npm run preview` for production build preview

### Video/Audio Not Working
- Grant camera & microphone permissions when prompted
- IMPORTANT: For real network (not localhost), set up a TURN server:
  - Add to `backend/src/pages/InterviewRoom.jsx` RTC config:
    ```javascript
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:turnserver.example.com', username: 'user', credential: 'pass' }
      ]
    };
    ```

### Build Errors
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

---

## File Highlights

### Backend Files
- `backend/server.js` – Express app setup & Socket.IO initialization
- `backend/src/app.js` – Route mounting (run, submissions, analytics, AI, rooms, recordings)
- `backend/src/controllers/runController.js` – Judge0 integration
- `backend/src/controllers/aiController.js` – OpenAI hints & reviews
- `backend/src/controllers/recordingController.js` – Session recording uploads

### Frontend Files
- `frontend/my-app/src/pages/Practice.jsx` – Problem bank & code arena
- `frontend/my-app/src/pages/InterviewRoom.jsx` – Video room with WebRTC
- `frontend/my-app/src/components/editor/CodeEditorPanel.jsx` – Run, hint, review UX
- `frontend/my-app/src/services/runService.js` – Backend API client for code runs
- `frontend/my-app/src/utils/mockData.js` – 60 mock problems

---

## Database Schema

### Collections (Auto-created by Mongoose)

**Submission**
```javascript
{
  userId: String,
  language: String,
  source: String,
  problemId: String,
  result: Object,
  createdAt: Date
}
```

**Room** (if backend implements DB persistence)
```javascript
{
  roomId: String,
  participants: Array,
  code: String,
  messages: Array,
  createdAt: Date
}
```

---

## API Endpoints

### Code Execution
- `POST /api/run` – Run code on Judge0 or mock

### Submissions
- `GET /api/submissions/:userId` – User's submissions
- `GET /api/submissions/stats/:userId` – Stats (accepted count, etc.)

### Analytics
- `GET /api/analytics` – Platform-wide stats

### AI Features
- `POST /api/ai/hint` – Request hint for problem
- `POST /api/ai/review` – Request code review

### Rooms
- `GET /api/rooms/:roomId` – Get room details
- `POST /api/rooms` – Create room (Socket.IO driven)

### Recordings
- `POST /api/recordings/upload` – Upload session recording

---

## Performance & Optimization

- **Frontend**: Vite dev server provides hot module replacement during development
- **Backend**: Mock fallbacks prevent external API latency during dev
- **Recording**: WebM format; consider client-side compression or cloud storage (S3) for production
- **Database queries**: Collection indexes not yet added; add if you have >10k records

---

## Security Notes (Pre-Production)

- [ ] Add request validation & input sanitization
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Use HTTPS in production
- [ ] Secure MongoDB (enable auth, IP whitelist)
- [ ] Add CORS origin restriction
- [ ] Use environment variable secrets manager
- [ ] Add authentication middleware for API routes
- [ ] Implement file upload size/type limits
- [ ] Set up TURN server for WebRTC in production

---

## For Office PC Handover

1. **Copy entire `BTP/` folder** to your office PC
2. **Create `backend/.env`** with MongoDB URI and optional API keys
3. **Run installation & startup** steps above
4. **Open http://localhost:5173** in browser
5. **Test each page** (Practice, Interview, Dashboard)
6. **Check console logs** (backend terminal & browser F12) for any warnings

---

## Next Steps After Setup

- **Expand problem bank**: Edit `frontend/my-app/src/utils/mockData.js` or connect to backend DB endpoint
- **Add database persistence**: Replace mock data with MongoDB queries
- **Deploy to production**: Use platforms like Vercel (frontend), Railway or Render (backend)
- **Add real WebRTC TURN**: For users on different networks
- **Enable payment/submission limits**: Rate limit by user tier

---

## Support & References

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Socket.IO Docs](https://socket.io/docs/)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Judge0 API Docs](https://judge0.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)

---

**Last Updated**: May 4, 2026  
**Status**: Ready for Office PC deployment
