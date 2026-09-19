// The Node signaling server. Override with VITE_SERVER_URL if needed
// (e.g. testing from a phone: set it to http://<your-laptop-lan-ip>:4000).
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

// Public STUN servers are enough for most home/office networks. For users
// behind strict/symmetric NATs you would add a TURN server here later.
// Provide TURN via env for users behind strict/symmetric NATs (common on
// mobile networks). STUN alone is not enough for many cross-internet peers.
//   VITE_TURN_URL=turn:your-turn-host:3478
//   VITE_TURN_USERNAME=user
//   VITE_TURN_CREDENTIAL=pass
const turnUrl = import.meta.env.VITE_TURN_URL;

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  ...(turnUrl
    ? [
        {
          urls: turnUrl,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        } as RTCIceServer,
      ]
    : []),
];

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
