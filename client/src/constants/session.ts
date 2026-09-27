// Shared types and tuning constants for the ITMajdoor session
// (matchmaking + WebRTC + chat). Kept here so components and the session hook
// import from one place instead of redefining them.

/** High-level state of the current session, drives the UI status. */
export type Status = "idle" | "waiting" | "connecting" | "connected";

/** Live connection quality, derived from WebRTC getStats(). */
export type ConnectionQuality = "good" | "ok" | "poor" | "unknown";

/** A single chat message, from either "me" or the partner ("them"). */
export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  ts: number; // epoch millis when the message was created/received
}

/** WebRTC signaling payload relayed through the server. */
export interface SignalPayload {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

/** How often to sample WebRTC stats for the connection-quality indicator. */
export const QUALITY_POLL_MS = 3000;

/**
 * Quality thresholds. A sample is "poor" if it exceeds the POOR limits, "ok"
 * if it exceeds the OK limits, otherwise "good".
 *   loss = fraction of packets lost over the last interval (0..1)
 *   rtt  = round-trip time in milliseconds
 */
export const QUALITY_THRESHOLDS = {
  poor: { loss: 0.05, rttMs: 400 },
  ok: { loss: 0.02, rttMs: 200 },
} as const;

/** Idle delay before we tell the partner we've stopped typing. */
export const TYPING_IDLE_MS = 1500;

/** Max chat message length (also enforced server-side). */
export const MAX_MESSAGE_LENGTH = 2000;

/** Quick-start chat openers shown as tappable pills before the first message. */
export const STARTER_MESSAGES = [
  "Hi Majdoor, how are you? 👋",
  "Which stack are you on these days? 💻",
  "Rough sprint or chill week? 😅",
];

/** Text shown on the video stage for each pre-connected status. */
export const STAGE_TEXT = {
  waiting: "Finding another IT Majdoor across the universe…",
  connecting: "Connecting you two…",
  notConnected: "Not connected",
  cameraOff: "Camera off",
} as const;

/** Emoji reactions the user can send; they float up over the video. */
export const REACTION_EMOJIS = ["👍", "😂", "🔥", "❤️", "👏", "😮"] as const;

/** How long a floating reaction stays before removal (matches the CSS animation). */
export const REACTION_LIFETIME_MS = 4000;

/** A single floating reaction instance shown over the video. */
export interface FloatingReaction {
  id: string;
  emoji: string;
}

/**
 * Domains a user can pick before joining, for interest-based matching.
 * "all" is special: it matches with anyone. The `id` is what's sent to the
 * server; the `label` and `emoji` are for display.
 */
export interface Domain {
  id: string;
  label: string;
  emoji: string;
}

export const DOMAINS: Domain[] = [
  { id: "all", label: "All", emoji: "🌐" },
  { id: "frontend", label: "Frontend", emoji: "🎨" },
  { id: "backend", label: "Backend", emoji: "⚙️" },
  { id: "fullstack", label: "Fullstack", emoji: "🧩" },
  { id: "mobile", label: "Mobile", emoji: "📱" },
  { id: "devops", label: "DevOps", emoji: "🚀" },
  { id: "cloud", label: "Cloud", emoji: "☁️" },
  { id: "data", label: "Data / ML / AI", emoji: "🤖" },
  { id: "qa", label: "QA / Testing", emoji: "🧪" },
  { id: "security", label: "Security", emoji: "🔐" },
  { id: "sde", label: "SDE", emoji: "💻" },
  { id: "sre", label: "SRE", emoji: "🛠️" },
  { id: "database", label: "Database", emoji: "🗄️" },
  { id: "embedded", label: "Embedded / IoT", emoji: "🔌" },
  { id: "game", label: "Game Dev", emoji: "🎮" },
  { id: "blockchain", label: "Blockchain", emoji: "⛓️" },
  { id: "design", label: "UI/UX Design", emoji: "🖌️" },
  { id: "pm", label: "Product / PM", emoji: "📋" },
  { id: "support", label: "IT Support", emoji: "🖥️" },
  { id: "student", label: "Student / Learner", emoji: "🎓" },
  { id: "other", label: "Other", emoji: "✨" },
];

/** The set of valid domain ids, used to validate what the client sends. */
export const DOMAIN_IDS = DOMAINS.map((d) => d.id);
