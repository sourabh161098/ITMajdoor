# ITMajdoor

An Omegle-style web app that pairs random IT workers for 1:1 text chat and video.
No database, no login. Matchmaking state lives in memory on the Node server;
video is peer-to-peer over WebRTC.

## Stack

- **Frontend:** Vite + React + TypeScript, Socket.IO client, native WebRTC
- **Backend:** Node + Express + Socket.IO (in-memory matchmaking + signaling relay)
- **Video:** WebRTC peer-to-peer with public Google STUN servers

## How it works

1. A user clicks **Join ITMajdoor** and enters an in-memory waiting queue.
2. The server pairs them at random with another waiting user.
3. The two browsers exchange WebRTC signaling (SDP + ICE) through the server,
   then connect **directly** peer-to-peer for video/audio.
4. Text chat is relayed through the server over Socket.IO.
5. **Next** drops the current partner and re-queues both users. **Stop** leaves.

## Running locally

You need two terminals.

### 1. Backend

```bash
cd server
npm install
npm run dev        # http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

Open http://localhost:5173 in **two** browser tabs (or two different browsers)
and click **Join ITMajdoor** in each to match them together.

> Browsers only allow camera/mic on `localhost` or HTTPS. `localhost` is fine
> for local testing.

## Testing on a phone (same Wi-Fi)

1. Find your laptop's LAN IP (e.g. `192.168.1.20`).
2. Start the client with the server URL pointed at that IP:
   ```bash
   cd client
   VITE_SERVER_URL=http://192.168.1.20:4000 npm run dev
   ```
3. On the phone, browsers require HTTPS for camera access on non-localhost
   origins. For quick LAN testing use a tunnel (e.g. ngrok) or run Vite/Node
   behind HTTPS. STUN-only works on most home Wi-Fi; add a TURN server for
   strict networks.

## Configuration

| Variable          | Where    | Default                 | Purpose                          |
| ----------------- | -------- | ----------------------- | -------------------------------- |
| `PORT`            | server   | `4000`                  | Node server port                 |
| `CLIENT_ORIGIN`   | server   | `http://localhost:5173` | Allowed CORS origin              |
| `VITE_SERVER_URL` | client   | `http://localhost:4000` | Signaling server URL             |

## Next steps toward production

- Add a **TURN** server for users behind symmetric NATs.
- Serve both client and server over **HTTPS**.
- Add rate limiting / abuse controls and a report button.
- Optional: interest tags, nicknames, "text only" vs "video" modes.
