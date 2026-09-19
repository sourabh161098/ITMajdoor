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

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

/**
 * Socket.IO event contract (client <-> server)
 *
 * Client -> Server:
 *   "join"                       -> ask to be matched with a random waiting user
 *   "next"                       -> leave current partner and rejoin the queue
 *   "chat:message" { text }      -> send a text message to current partner
 *   "signal" { description|candidate } -> relay a WebRTC signal to current partner
 *
 * Server -> Client:
 *   "waiting"                    -> you are in the queue, no partner yet
 *   "matched" { initiator }      -> you have a partner; initiator decides who makes the WebRTC offer
 *   "partner:left"               -> your partner disconnected or skipped
 *   "chat:message" { text }      -> an incoming text message from your partner
 *   "signal" { ... }             -> an incoming WebRTC signal from your partner
 */

function pairUp(socket, partnerId) {
  // The user who was already waiting becomes the WebRTC "initiator" (creates the offer).
  // The user who just joined is the "callee". This avoids both sides offering at once.
  socket.emit("matched", { initiator: false });
  io.to(partnerId).emit("matched", { initiator: true });
}

io.on("connection", (socket) => {
  const enqueue = () => {
    const partnerId = matchmaker.join(socket.id);
    if (partnerId) {
      pairUp(socket, partnerId);
    } else {
      socket.emit("waiting");
    }
  };

  socket.on("join", enqueue);

  socket.on("next", () => {
    const exPartnerId = matchmaker.leave(socket.id);
    if (exPartnerId) {
      // Tell the ex-partner they were left, and put them back in the queue.
      io.to(exPartnerId).emit("partner:left");
      const newPartnerForEx = matchmaker.join(exPartnerId);
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
      const newPartnerForEx = matchmaker.join(exPartnerId);
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

  // Relay WebRTC signaling (SDP offers/answers and ICE candidates) untouched.
  socket.on("signal", (payload) => {
    const partnerId = matchmaker.getPartner(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("signal", payload);
    }
  });

  socket.on("disconnect", () => {
    const exPartnerId = matchmaker.leave(socket.id);
    if (exPartnerId) {
      io.to(exPartnerId).emit("partner:left");
      // Auto re-queue the partner who got left behind.
      const newPartner = matchmaker.join(exPartnerId);
      if (newPartner) {
        pairUp(io.sockets.sockets.get(exPartnerId), newPartner);
      } else {
        io.to(exPartnerId).emit("waiting");
      }
    }
  });
});

// Bind to 0.0.0.0 so cloud hosts (Render/Railway/Fly) can route to the port.
server.listen(PORT, "0.0.0.0", () => {
  console.log(`ITMajdoor server listening on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")} (+ *.netlify.app)`);
});
