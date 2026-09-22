# ITMajdoor

An Omegle-style web app that pairs random IT workers for 1-on-1 **video + text
chat**. No database, no login, nothing stored. Matchmaking lives in memory on a
Node server; video is peer-to-peer over WebRTC.

**Live:** [itmajdoor.netlify.app](https://itmajdoor.netlify.app) ·
**API:** [itmajdoor-server.onrender.com](https://itmajdoor-server.onrender.com)

---

## Features

### Matchmaking & session
- **One-click join** — enter a random queue and get paired instantly with
  another waiting user.
- **Next** — drop the current partner and get re-queued for a new one (both
  sides are re-paired).
- **Stop** — leave entirely, release camera/mic, and return to the landing page.
- **Accurate presence** — the "Connected / Connecting / Searching" status is
  driven by the real `RTCPeerConnection` state, not just the socket match, so it
  never shows a fake "connected".
- **Auto-recovery** — transient ICE failures trigger an ICE restart; genuine
  failures re-queue you automatically.

### Video (WebRTC, peer-to-peer)
- Direct browser-to-browser video/audio — media never touches the server.
- **720p @ 30fps** capture with a raised encoder bitrate (~2.5 Mbps) for a
  sharp picture.
- **TURN relay** via Twilio so it works across mobile data, strict NATs, and
  laptop↔phone (not just same-network). Credentials are minted server-side and
  never shipped in the browser bundle.
- Mobile video fills the screen in portrait (no letterboxing).
- Picture-in-picture self view (mirrored), with camera-off and mic-off badges.

### Chat
- **Toggleable chat panel** — hidden by default, opens from a button in the
  controls. Slides in as a side column on desktop (video shrinks to fit) and a
  bottom sheet on mobile (video stays visible on top).
- **Unread badge** — counts only messages *received* from your partner while
  the chat is closed. Your own messages never count, and opening the chat marks
  everything read. Resets per partner.
- **Typing indicator** — a lightweight animated-dots bubble shown above the
  input while your partner is typing (debounced, low traffic).
- **Starter pills** — tap a suggested opener ("Hi Majdoor, how are you? 👋",
  etc.) to send it instantly and break the ice.
- Timestamps on every message, auto-scroll to latest.

### Landing & content
- Animated **ITMajdoor** hero with a floating laptop mark and gradient text.
- **Rotating quotes** shown in a macOS-style terminal window (traffic-light
  dots, shell prompt, blinking cursor). ~100 IT-humor quotes picked at random,
  rotating every 10s. The window adapts: light terminal in light mode, dark in
  dark mode.
- **Guidelines & Disclaimer** page — an accordion covering "just for fun", "no
  company data", "no project details", "we don't store your data", and safety.
- **Light / dark theme** toggle (persisted), with an ambient accent glow behind
  both the landing and guidelines pages.

### Privacy
- No accounts, no database, nothing written to disk.
- Video/audio is peer-to-peer; chat messages are relayed live and never stored.
- No name, email, or login is ever collected.

---

## Stack

- **Frontend:** Vite + React + TypeScript, Tailwind CSS, Headless UI, Socket.IO
  client, native WebRTC, lucide-react icons. Deployed on **Netlify**.
- **Backend:** Node + Express + Socket.IO — in-memory matchmaking + WebRTC
  signaling relay, plus a `/ice-servers` endpoint that mints TURN credentials.
  Deployed on **Render**.
- **Video transport:** WebRTC (STUN + Twilio TURN).

### Why Render for the backend?
Netlify can't hold persistent WebSocket connections or shared in-memory state
(it's serverless), and matchmaking needs both. So the Socket.IO server runs on
Render; only the static frontend is on Netlify.

---

## How it works

1. A user clicks **Join ITMajdoor** and enters an in-memory waiting queue.
2. The client fetches ICE servers (STUN + TURN) from the backend's
   `/ice-servers` endpoint.
3. The server pairs the user at random with another waiting user. The one who
   was already waiting becomes the WebRTC **initiator** (makes the offer).
4. The two browsers exchange WebRTC signaling (SDP + ICE candidates) through the
   server, then connect **directly** peer-to-peer for video/audio.
5. Text chat and the typing indicator are relayed through the server over
   Socket.IO.
6. **Next** re-queues both users; **Stop** removes the leaver and re-queues the
   partner.

### Socket.IO event contract

| Direction        | Event            | Payload                     | Meaning                                    |
| ---------------- | ---------------- | --------------------------- | ------------------------------------------ |
| client → server  | `join`           | —                           | Enter the queue                            |
| client → server  | `next`           | —                           | Leave partner, re-queue                    |
| client → server  | `leave`          | —                           | Leave entirely (Stop)                      |
| client → server  | `chat:message`   | `{ text }`                  | Send a chat message                        |
| client → server  | `typing`         | `{ typing }`                | Relay typing state                         |
| client → server  | `signal`         | `{ description \| candidate }` | Relay a WebRTC signal                   |
| server → client  | `waiting`        | —                           | In queue, no partner yet                   |
| server → client  | `matched`        | `{ initiator }`             | Paired; initiator makes the offer          |
| server → client  | `partner:left`   | —                           | Partner disconnected or skipped            |
| server → client  | `chat:message`   | `{ text }`                  | Incoming chat message                      |
| server → client  | `typing`         | `{ typing }`                | Partner started/stopped typing             |
| server → client  | `signal`         | `{ ... }`                   | Incoming WebRTC signal                     |

---

## Project structure

```
client/                 Vite + React + TS frontend (Netlify)
  src/
    components/
      landing/           Landing hero + rotating quote terminal window
      guidelines/        Guidelines/disclaimer page + accordion
      session/           In-call UI: VideoStage, Chat, Session
      ui/                Button, IconButton primitives
    constants/           config (server URL, ICE, media constraints), quotes
    hooks/               useMajdoorSession (session lifecycle), useTheme
server/                  Node + Express + Socket.IO backend (Render)
  src/
    index.js             HTTP + Socket.IO server, /health, /ice-servers
    matchmaker.js        In-memory queue + pairing
```

---

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

Open http://localhost:5173 in **two** browser tabs (or two browsers) and click
**Join ITMajdoor** in each to match them together.

> Browsers only allow camera/mic on `localhost` or HTTPS. `localhost` is fine
> for local testing.

## Testing on a phone (same Wi-Fi)

1. Find your laptop's LAN IP (e.g. `192.168.1.20`).
2. Point the client at it:
   ```bash
   cd client
   VITE_SERVER_URL=http://192.168.1.20:4000 npm run dev
   ```
3. Phones require HTTPS for camera access on non-localhost origins. Use a tunnel
   (e.g. ngrok) for quick testing. STUN-only works on most home Wi-Fi; the
   deployed app uses TURN for everything else.

---

## Configuration

### Client (`client/.env`)

| Variable          | Default                 | Purpose               |
| ----------------- | ----------------------- | --------------------- |
| `VITE_SERVER_URL` | `http://localhost:4000` | Signaling server URL  |

Production uses `client/.env.production` →
`VITE_SERVER_URL=https://itmajdoor-server.onrender.com`.

### Server

| Variable              | Default                 | Purpose                                   |
| --------------------- | ----------------------- | ----------------------------------------- |
| `PORT`                | `4000`                  | Node server port                          |
| `CLIENT_ORIGIN`       | `http://localhost:5173` | Allowed CORS origin(s), comma-separated   |
| `TWILIO_ACCOUNT_SID`  | —                       | Twilio account SID (dynamic TURN creds)   |
| `TWILIO_AUTH_TOKEN`   | —                       | Twilio auth token (kept server-side only) |
| `TURN_URLS`           | —                       | Static/self-hosted TURN URLs (alt to Twilio) |
| `TURN_USERNAME`       | —                       | Static TURN username                      |
| `TURN_CREDENTIAL`     | —                       | Static TURN credential                    |

CORS also allows any `*.netlify.app` origin (for deploy previews).

### ICE / TURN resolution order (`/ice-servers`)
1. **Static TURN** if `TURN_URLS` + `TURN_USERNAME` + `TURN_CREDENTIAL` are set.
2. **Twilio** dynamic credentials if `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`
   are set (current production setup).
3. **Fallback**: public Google STUN + free OpenRelay TURN.

---

## Deployment

- **Frontend (Netlify):** build `npm run build` in `client/`, publish the
  `client/dist` directory. `VITE_SERVER_URL` comes from `.env.production`.
- **Backend (Render):** Node web service from `server/`, start `npm start`, with
  `CLIENT_ORIGIN` and the Twilio env vars set. Binds `0.0.0.0` so Render can
  route to it. `/health` is used for health checks.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for step-by-step instructions.

---

## Hosting & scaling (free tiers)

Video is peer-to-peer (WebRTC), so the video/audio streams flow **directly
between the two browsers** and never go through our server. That keeps the
backend light and cheap.

### Netlify — frontend ([netlify.com](https://www.netlify.com))
- Just serves the static site (HTML/JS/CSS) over a global CDN.
- Free plan: **100 GB bandwidth/month**. Our bundle is tiny (~250 KB gzipped),
  so this is effectively unlimited for our traffic — not a bottleneck.

### Render — backend ([render.com](https://render.com))
- Runs the Node + Socket.IO server (matchmaking + signaling relay).
- Free instance: **512 MB RAM, 0.1 CPU**.
- Realistically handles **~500 concurrent users** comfortably (a few hundred
  live 1-on-1 calls), since it only relays tiny messages, not video.
- **Cold start:** the free service sleeps after ~15 min of no traffic and takes
  ~50–60s to wake, so the first user after a quiet period waits a bit.
- This is our practical concurrency ceiling. A paid instance removes the sleep
  and adds CPU for thousands of users.

### Twilio TURN — video relay ([twilio.com](https://www.twilio.com))
- Most calls connect directly peer-to-peer. But ~15–20% (mobile data, strict
  corporate NATs) **can't**, and must relay their video through a TURN server.
- We use Twilio for that. When a call relays, the **video does flow through
  Twilio and is billed per GB** (roughly $0.40–0.80/GB).
- So Twilio isn't a "how many users" limit — it's a **cost** limit. A few
  long relayed video calls can quietly add up. Worth watching if traffic grows.

**Summary:** Netlify is essentially free/unlimited, Render caps us at a few
hundred concurrent users (and sleeps when idle), and Twilio is the thing to
watch for cost, not capacity.

---

## Possible next steps

- Rate limiting / abuse controls and a report button.
- Interest tags or "text only" vs "video" modes.
- Reconnection UX polish for flaky mobile networks.
