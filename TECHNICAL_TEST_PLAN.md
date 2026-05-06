# Technical Testing Checklist - Pre-Demo Verification

## SETUP (Run these once)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend/my-app
npm run dev

# Both should show:
# Backend: "Backend listening on http://localhost:5002"
# Frontend: "VITE v7.x.x ready in XXXms"
```

---

## TEST 1: Authorization Header Attached ✓

**What**: Verify that all API calls include the JWT token

**Steps**:
1. Open frontend at `http://localhost:5173`
2. Open DevTools → Network tab
3. Register or Login
4. Click any API endpoint (e.g., fetch problems)
5. Select the request in Network tab
6. Check "Request Headers" section

**Expected Result**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Status**: ✅ PASS if header is present

---

## TEST 2: Socket Join-Room Payload ✓

**What**: Verify socket emit includes both userId and participantId

**Steps**:
1. Login successfully (get a token)
2. Navigate to Interview Room (click join room)
3. Open DevTools → Network → WS (WebSocket) tab
4. Look for messages with "join-room"
5. Examine the frame data

**Expected JSON Payload**:
```json
{
  "roomId": "G001",
  "userId": "69fb522427527b7b408cc05d",    // ObjectId from DB
  "participantId": "participant-1714...",   // String generated per session
  "userName": "Test User"
}
```

**Status**: ✅ PASS if both userId (ObjectId format) and participantId are present

---

## TEST 3: Media Toggles Modify Stream ✓

**What**: Verify microphone and camera toggles actually mute/unmute the stream

**Steps**:
1. Allow camera/mic permissions when prompted
2. In Interview Room, click "Start Video" button
3. Open DevTools → Console (important!)
4. Paste this code:
   ```javascript
   // Get the first audio track
   const audioTrack = document.querySelector('video').srcObject?.getAudioTracks()[0];
   console.log('Audio enabled:', audioTrack?.enabled);
   ```
5. Click the **Microphone Toggle** button in the UI
6. Paste the code again and check the value

**Expected Result**:
- First check: `Audio enabled: true`
- After clicking toggle: `Audio enabled: false`
- Click again: `Audio enabled: true`

**Status**: ✅ PASS if enabled property actually changes

---

## TEST 4: WebRTC Signaling Intact ✓

**What**: Verify offer/answer/ICE candidate events work

**Steps**:
1. Open 2 browser tabs at `http://localhost:5173`
2. Tab 1: Login & create/join a room (e.g., G001)
3. Tab 2: Login & join the SAME room
4. Wait 3-5 seconds for WebRTC negotiation
5. Both windows should show: **"Status: Connected"** and **"Peer connected"**
6. Open DevTools → Console and paste:
   ```javascript
   // Check if video is streaming
   console.log('Remote video ready:', !!window.remoteVideoRef?.current?.srcObject);
   ```

**Expected Result**:
- Both users show "Peer connected"
- Remote video feeds should display (or show as active)
- No errors in console related to WebRTC

**Status**: ✅ PASS if peer connection succeeds

---

## TEST 5: AI Chat Endpoint (Auth Protected) ✓

**What**: Verify `/api/ai/chat` requires JWT and rejects unauthenticated requests

**Steps**:

### 5A: Test WITHOUT Token (Should fail with 401)
```bash
curl -X POST http://localhost:5002/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "roomId":"G001",
    "code":"print(1+1)",
    "userMessage":"What does this code do?"
  }'
```

**Expected Result**:
```json
{
  "success": false,
  "message": "Authorization header is required"
}
```
Status code: **401**

### 5B: Test WITH Token (Should succeed with 200)
```bash
# First get a token by logging in
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Now call AI chat with the token
curl -X POST http://localhost:5002/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "roomId":"G001",
    "code":"print(1+1)",
    "userMessage":"What does this code do?"
  }'
```

**Expected Result**:
```json
{
  "success": true,
  "aiResponse": "This code prints the result of 1+1, which is 2..."
}
```
Status code: **200**

---

## TEST 6: Rate Limiting on AI Chat ✓

**What**: Verify rate limiter blocks after 5 requests in 15 minutes

**Steps**:
```bash
# Get a token first (same as above)
TOKEN="<your-jwt-token>"

# Send 6 requests rapidly
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:5002/api/ai/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "roomId":"G001",
      "code":"x=1",
      "userMessage":"test"
    }'
  echo "\n---"
  sleep 0.5
done
```

**Expected Result**:
- Requests 1-5: Return 200 with `{ "success": true, ... }`
- Request 6: Returns 429 with rate limit message

**Status**: ✅ PASS if 6th request gets 429 (Too Many Requests)

---

## TEST 7: Socket JWT Extraction ✓

**What**: Verify socket.io middleware extracts userId from JWT token

**Steps**:
1. Add this to backend `src/sockets/index.js` temporarily (for debugging):
   ```javascript
   io.use((socket, next) => {
     const token = socket.handshake.auth?.token;
     console.log('[Socket Auth] Token present:', !!token);
     console.log('[Socket Auth] Extracted userId:', socket.data.authUserId);
     // ... rest of middleware
   });
   ```
2. Restart backend
3. Join an Interview Room from authenticated browser tab
4. Check Terminal 1 (backend) output

**Expected Result**:
```
[Socket Auth] Token present: true
[Socket Auth] Extracted userId: 69fb522427527b7b408cc05d
```

**Status**: ✅ PASS if userId is extracted

---

## TEST 8: Database Relationships (ObjectId Refs) ✓

**What**: Verify submissions store proper ObjectId references

**Steps**:
```bash
# Login and create a submission
TOKEN="<your-jwt-token>"

curl -X POST http://localhost:5002/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "language":"python",
    "source":"print(1+1)",
    "problemId":"g001"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "submission": {
    "_id": "69fb8d75af69272693f3a33d",
    "userId": "69fb522427527b7b408cc05d",        // ObjectId, NOT string
    "language": "python",
    "source": "print(1+1)",
    "problemId": "69fb4b0728cb65ac8dc2b333",    // ObjectId, NOT "g001"
    ...
  }
}
```

**Verification**:
- `userId` is a 24-char hex string (ObjectId format)
- `problemId` is also a 24-char hex string (looking up from .id "g001")

**Status**: ✅ PASS if both are proper ObjectIds

---

## TEST 9: AI Chat in Interview Room (NEW) ✓

**What**: Test the new requestChat function works in the app

**Steps**:
1. Be in an Interview Room while authenticated
2. Write or paste some code in the editor
3. (Future feature) Once AI chat UI is added to Interview Room, test sending a message
4. Verify response comes back with AI answer

**Current Status**: ✅ requestChat function added to aiService.js, awaiting UI integration

---

## SUMMARY TABLE

| Test | Component | Status | Pass/Fail |
|------|-----------|--------|-----------|
| 1 | Frontend API Headers | Authorization auto-attached ✓ | MANUAL |
| 2 | Socket Payload | userId + participantId ✓ | MANUAL |
| 3 | Media Toggles | Stream tracks modify ✓ | MANUAL |
| 4 | WebRTC Signaling | Offer/answer/ICE intact ✓ | MANUAL |
| 5A | AI Auth (No Token) | 401 Rejected | MANUAL |
| 5B | AI Auth (With Token) | 200 Success | MANUAL |
| 6 | Rate Limiting | 429 on 6th req | MANUAL |
| 7 | Socket JWT Extract | userId extracted | MANUAL |
| 8 | Database Refs | ObjectId stored | MANUAL |
| 9 | AI Chat Function | requestChat added ✓ | CODE VERIFIED |

---

## QUICK SMOKE TEST (5 min)

If you only have limited time, run these core tests:

1. **Test 5B** (AI Chat with token) - Core security verification
2. **Test 2** (Socket payload) - WebRTC readiness verification
3. **Test 3** (Media toggles) - Media control verification

If all three pass → 🚀 **Ready for production demo**

---

## NEXT STEPS

1. Run all tests above
2. Document any failures in the PASS/FAIL column
3. Fix any issues found
4. Once all PASS, proceed to manual testing/demo
5. Optional: Integrate AI chat UI component into Interview Room for real-time chat during interviews

---
