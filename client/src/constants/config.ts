// The Node signaling server. Override with VITE_SERVER_URL if needed
// (e.g. testing from a phone: set it to http://<your-laptop-lan-ip>:4000).
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

// WebRTC ICE servers. STUN alone only works when both peers can hole-punch
// directly, which fails across many real networks (mobile, corporate,
// symmetric NAT). A TURN relay is required for those peers to connect.
//
// We include Metered's free public "OpenRelay" TURN servers so connections
// work out of the box. For production/heavy use, provide your own TURN via env
// (higher limits, more reliable):
//   VITE_TURN_URL=turn:your-turn-host:3478
//   VITE_TURN_USERNAME=user
//   VITE_TURN_CREDENTIAL=pass
const turnUrl = import.meta.env.VITE_TURN_URL;

const turnUsername = import.meta.env.VITE_TURN_USERNAME;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },

  // Your own TURN server (e.g. a free Metered account). Strongly recommended:
  // required for peers on different networks / mobile (CGNAT), where a direct
  // P2P path is impossible and media must be relayed. Configure via env:
  //   VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL
  ...(turnUrl && turnUsername && turnCredential
    ? [
        {
          urls: turnUrl,
          username: turnUsername,
          credential: turnCredential,
        } as RTCIceServer,
      ]
    : []),

  // Fallback: free public TURN (Metered OpenRelay). Works, but is shared and
  // rate-limited, so it can be unreliable for real cross-network calls.
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

/**
 * Fetch ICE servers from the backend (which can inject fresh Metered TURN
 * credentials without exposing any secret in the browser). Falls back to the
 * static ICE_SERVERS above if the request fails.
 */
export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch(`${SERVER_URL}/ice-servers`);
    if (!res.ok) throw new Error(`ice-servers responded ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      return data.iceServers;
    }
  } catch (err) {
    console.warn("Falling back to static ICE servers:", err);
  }
  return ICE_SERVERS;
}

// Media capture constraints. We ask for 720p @ 30fps as the target (with an
// "ideal" hint so the browser falls back gracefully on weaker cameras), plus
// standard audio processing for clearer voice.
export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: "user",
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// Cap the outgoing video bitrate. Browsers default video fairly low, so we
// raise the ceiling to ~2.5 Mbps for a noticeably sharper 720p picture.
export const MAX_VIDEO_BITRATE = 2_500_000; // bits per second
