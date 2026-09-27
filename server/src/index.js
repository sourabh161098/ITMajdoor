import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { Matchmaker } from "./matchmaker.js";

const PORT = process.env.PORT || 4000;

// Comma-separated list of allowed browser origins. In production set this to
// your Netlify URL(s), e.g. "https://itmajdoor.netlify.app,https://your-domain".
// Defaults to the local Vite dev server.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = CLIENT_ORIGIN.split(",").map((o) => o.trim());

// CORS: allow the configured origins, plus any *.netlify.app (deploy previews
// get unique subdomains). Requests with no Origin (curl, health checks) pass.
function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith(".netlify.app")) return true;
  } catch {
    /* malformed origin -> reject below */
  }
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  methods: ["GET", "POST"],
};

const app = express();
app.use(cors(corsOptions));

// Lightweight health/stats endpoint, used by the host's health checks too.
const matchmaker = new Matchmaker();
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ...matchmaker.stats() });
});

// --- ICE servers (STUN/TURN) -------------------------------------------
// The client fetches its ICE servers from here on startup. This keeps any
// TURN secret on the server instead of baking it into the browser bundle.
//
// Supported providers (set env vars on Render):
//
//   Twilio (recommended): dynamic credentials via API
//     TWILIO_ACCOUNT_SID
//     TWILIO_AUTH_TOKEN
//
//   Self-hosted coturn (or any static TURN): fixed credentials
//     TURN_URLS         comma-separated, e.g.
//                       "turn:1.2.3.4:3478,turn:1.2.3.4:3478?transport=tcp"
//     TURN_USERNAME
//     TURN_CREDENTIAL
//
// Without any of these, we fall back to public STUN + the free OpenRelay TURN.
const FALLBACK_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Build static ICE servers from a self-hosted / fixed-credential TURN server.
function staticTurnServers() {
  const urls = process.env.TURN_URLS;
  const username = process.env.TURN_USERNAME;
  const credential = process.env.TURN_CREDENTIAL;
  if (!urls || !username || !credential) return null;
  return [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: urls.split(",").map((u) => u.trim()),
      username,
      credential,
    },
  ];
}

// Fetch short-lived TURN credentials from Twilio's Network Traversal Service.
async function twilioIceServers() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Tokens.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const upstream = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!upstream.ok) throw new Error(`Twilio responded ${upstream.status}`);
  const data = await upstream.json();
  // Twilio returns { ice_servers: [{ url|urls, username, credential }, ...] }.
  return data.ice_servers.map((s) => ({
    urls: s.urls || s.url,
    username: s.username,
    credential: s.credential,
  }));
}

app.get("/ice-servers", async (_req, res) => {
  // 1) Static/self-hosted TURN if configured.
  const staticServers = staticTurnServers();
  if (staticServers) return res.json({ iceServers: staticServers });

  // 2) Twilio dynamic credentials if configured.
  try {
    const twilio = await twilioIceServers();
    if (twilio) return res.json({ iceServers: twilio });
  } catch (err) {
    console.error("Twilio TURN fetch failed:", err.message);
  }

  // 3) Fallback: public STUN + OpenRelay.
  res.json({ iceServers: FALLBACK_ICE_SERVERS });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  // Prefer WebSocket and skip the HTTP long-poll upgrade dance where possible:
  // lower per-connection overhead and latency for our signaling/relay traffic.
  transports: ["websocket", "polling"],
  // Heartbeat: detect dead/ghost connections reasonably fast so stale users
  // don't linger in the matchmaking queue, without being so aggressive that a
  // brief mobile network blip drops a live call.
  pingInterval: 25000,
  pingTimeout: 20000,
  // Drop oversized handshake payloads early (defensive against abuse).
  maxHttpBufferSize: 1e6, // 1 MB
});

/**
 * Socket.IO event contract (client <-> server)
 *
 * Client -> Server:
 *   "join"                       -> ask to be matched with a random waiting user
 *   "next"                       -> leave current partner and rejoin the queue
 *   "chat:message" { text }      -> send a text message to current partner
 *   "typing" { typing }          -> relay a typing indicator to current partner
 *   "reaction" { emoji }         -> relay an emoji reaction to current partner
 *   "cam" { on }                 -> relay your camera on/off state to partner
 *   "signal" { description|candidate } -> relay a WebRTC signal to current partner
 *
 * Server -> Client:
 *   "waiting"                    -> you are in the queue, no partner yet
 *   "matched" { initiator }      -> you have a partner; initiator decides who makes the WebRTC offer
 *   "partner:left"               -> your partner disconnected or skipped
 *   "chat:message" { text }      -> an incoming text message from your partner
 *   "typing" { typing }          -> your partner started/stopped typing
 *   "reaction" { emoji }         -> your partner sent an emoji reaction
 *   "cam" { on }                 -> your partner turned their camera on/off
 *   "signal" { ... }             -> an incoming WebRTC signal from your partner
 */

function pairUp(socket, partnerId) {
  // The user who was already waiting becomes the WebRTC "initiator" (creates the offer).
  // The user who just joined is the "callee". This avoids both sides offering at once.
  socket.emit("matched", { initiator: false });
  io.to(partnerId).emit("matched", { initiator: true });
}

// Sanitize the domain sent by a client: only accept known ids, else "all".
const VALID_DOMAINS = new Set([
  "all", "frontend", "backend", "fullstack", "mobile", "devops", "cloud",
  "data", "qa", "security", "sde", "sre", "database", "embedded", "game",
  "blockchain", "design", "pm", "support", "student", "other",
]);
function cleanDomain(domain) {
  return typeof domain === "string" && VALID_DOMAINS.has(domain)
    ? domain
    : "all";
}

io.on("connection", (socket) => {
  // Remember the socket's chosen domain across join/next.
  let socketDomain = "all";

  const enqueue = () => {
    const partnerId = matchmaker.join(socket.id, socketDomain);
    if (partnerId) {
      pairUp(socket, partnerId);
    } else {
      socket.emit("waiting");
    }
  };

  socket.on("join", ({ domain } = {}) => {
    socketDomain = cleanDomain(domain);
    enqueue();
  });

  socket.on("next", ({ domain } = {}) => {
    if (domain !== undefined) socketDomain = cleanDomain(domain);
    const exPartnerId = matchmaker.leave(socket.id);
    if (exPartnerId) {
      // Tell the ex-partner they were left, and put them back in the queue.
      io.to(exPartnerId).emit("partner:left");
      const newPartnerForEx = matchmaker.join(
        exPartnerId,
        matchmaker.getDomain(exPartnerId)
      );
      if (newPartnerForEx) {
        pairUp(io.sockets.sockets.get(exPartnerId), newPartnerForEx);
      } else {
        io.to(exPartnerId).emit("waiting");
      }
    }
    // Re-queue the requesting user.
    enqueue();
  });

  socket.on("leave", () => {
    // The user is exiting entirely (Stop). Remove them from the queue/pairing
    // and requeue their ex-partner, but do NOT requeue the leaving user.
    const exPartnerId = matchmaker.leave(socket.id);
    if (exPartnerId) {
      io.to(exPartnerId).emit("partner:left");
      const newPartnerForEx = matchmaker.join(
        exPartnerId,
        matchmaker.getDomain(exPartnerId)
      );
      if (newPartnerForEx) {
        pairUp(io.sockets.sockets.get(exPartnerId), newPartnerForEx);
      } else {
        io.to(exPartnerId).emit("waiting");
      }
    }
  });

  socket.on("chat:message", ({ text } = {}) => {
    const partnerId = matchmaker.getPartner(socket.id);
    if (partnerId && typeof text === "string" && text.trim()) {
      io.to(partnerId).emit("chat:message", { text: text.slice(0, 2000) });
    }
  });

  // Relay a lightweight typing indicator to the current partner.
  socket.on("typing", ({ typing } = {}) => {
    const partnerId = matchmaker.getPartner(socket.id);
    if (partnerId) io.to(partnerId).emit("typing", { typing: !!typing });
  });

  // Relay an emoji reaction to the current partner.
  socket.on("reaction", ({ emoji } = {}) => {
    const partnerId = matchmaker.getPartner(socket.id);
    if (partnerId && typeof emoji === "string" && emoji.length <= 8) {
      io.to(partnerId).emit("reaction", { emoji });
    }
  });

  // Relay the sender's camera on/off state to the current partner, so their
  // UI can show a "camera off" placeholder instead of a black video.
  socket.on("cam", ({ on } = {}) => {
    const partnerId = matchmaker.getPartner(socket.id);
    if (partnerId) io.to(partnerId).emit("cam", { on: !!on });
  });

  // Relay WebRTC signaling (SDP offers/answers and ICE candidates) untouched.
  socket.on("signal", (payload) => {
    const partnerId = matchmaker.getPartner(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("signal", payload);
    }
  });

  socket.on("disconnect", () => {
    const exPartnerId = matchmaker.leave(socket.id);
    matchmaker.forget(socket.id);
    if (exPartnerId) {
      io.to(exPartnerId).emit("partner:left");
      // Auto re-queue the partner who got left behind, keeping their domain.
      const newPartner = matchmaker.join(
        exPartnerId,
        matchmaker.getDomain(exPartnerId)
      );
      if (newPartner) {
        pairUp(io.sockets.sockets.get(exPartnerId), newPartner);
      } else {
        io.to(exPartnerId).emit("waiting");
      }
    }
  });
});

// Periodic sweep: pair up users who waited past the fallback window without a
// domain match, so nobody is stuck forever when few share their interest.
setInterval(() => {
  const pairs = matchmaker.sweep();
  for (const [a, b] of pairs) {
    const sockA = io.sockets.sockets.get(a);
    if (sockA) {
      // a becomes callee, b (already waiting longer) becomes initiator.
      sockA.emit("matched", { initiator: false });
      io.to(b).emit("matched", { initiator: true });
    } else {
      // a vanished; put b back so it isn't orphaned.
      matchmaker.leave(b);
      io.to(b).emit("waiting");
    }
  }
}, 5000);

// Bind to 0.0.0.0 so cloud hosts (Render/Railway/Fly) can route to the port.
server.listen(PORT, "0.0.0.0", () => {
  console.log(`ITMajdoor server listening on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")} (+ *.netlify.app)`);
});
