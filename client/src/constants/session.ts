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
