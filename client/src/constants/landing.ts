import {
  Shuffle,
  Video,
  MessageSquare,
  ShieldCheck,
  Database,
  Network,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

/**
 * Static content for the landing page. Kept here (not inline in the component)
 * so copy and lists live in one place and are easy to tweak.
 */

export interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export const LANDING_FEATURES: Feature[] = [
  {
    icon: Shuffle,
    title: "Random match",
    desc: "Paired instantly and at random with whoever's in the queue — a dev, a DevOps on-call victim, or a curious designer. Luck of the draw.",
  },
  {
    icon: Video,
    title: "Live video",
    desc: "Low-latency peer-to-peer WebRTC video and crystal clear audio built directly in browser with zero install.",
  },
  {
    icon: MessageSquare,
    title: "Text chat",
    desc: "Chat alongside the call with formatted code block sharing, timestamps, and quick humorous developer emojis.",
  },
];

export interface TrustItem {
  icon: LucideIcon;
  label: string;
}

export const LANDING_TRUST: TrustItem[] = [
  { icon: ShieldCheck, label: "100% Anonymous" },
  { icon: Database, label: "Zero Logs Stored" },
  { icon: Network, label: "Direct WebRTC Mesh" },
  { icon: KeyRound, label: "End-to-End Media" },
];

/** Hero + CTA copy. */
export const LANDING_COPY = {
  pill: "Random 1-on-1 chat for IT folks",
  subtitle:
    "Get matched with a random IT worker for a quick video chat. Swap on-call horror stories, vent about sprint velocity, or just say hi — no logins, no pressure.",
  cta: "Join ITMajdoor",
  ctaMetaLead: "Instant Match",
  ctaMeta: ["Avg queue time: 4s", "WebRTC P2P"],
  ctaHelper:
    "You'll be paired with someone waiting in the queue. Camera & mic permissions required for audio/video.",
  footerDisclaimer:
    "Just for fun. Never share company credentials, production env keys, or proprietary IP.",
  footerCredit:
    "Built with React + Node · Peer-to-peer WebRTC · No accounts, no data stored",
} as const;
