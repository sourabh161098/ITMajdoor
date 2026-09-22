import { useEffect, useState } from "react";
import {
  Shuffle,
  Video,
  MessageSquare,
  Sun,
  Moon,
  ArrowRight,
  AlertTriangle,
  Laptop,
  BookOpen,
  HelpCircle,
  Zap,
  ShieldCheck,
  Database,
  Network,
  KeyRound,
} from "lucide-react";
import type { Theme } from "../../hooks/useTheme";
import { QuoteRotator } from "./QuoteRotator";
import { IconButton } from "../ui/IconButton";
import {
  DEFAULT_HEADLINE,
  HEADLINE_CYCLE_MS,
  getHeroMood,
} from "../../constants/moodline";

interface LandingProps {
  onJoin: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenGuidelines: () => void;
}

const FEATURES = [
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

const TRUST = [
  { icon: ShieldCheck, label: "100% Anonymous" },
  { icon: Database, label: "Zero Logs Stored" },
  { icon: Network, label: "Direct WebRTC Mesh" },
  { icon: KeyRound, label: "End-to-End Media" },
];

export function Landing({
  onJoin,
  theme,
  onToggleTheme,
  onOpenGuidelines,
}: LandingProps) {
  // Day-of-week "mood" headline. On Friday afternoon it alternates between the
  // brand name and the mood line every few seconds; otherwise it stays fixed.
  const [headline, setHeadline] = useState(() => getHeroMood().initial);

  useEffect(() => {
    const mood = getHeroMood();
    setHeadline(mood.initial);
    if (!mood.delayed) return;
    const interval = setInterval(() => {
      setHeadline((current) =>
        current === mood.initial ? (mood.delayed as string) : mood.initial
      );
    }, HEADLINE_CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  const isDefaultHeadline = headline === DEFAULT_HEADLINE;

  const scrollToFeatures = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)]/80 px-6 py-4 backdrop-blur">
        {/* Logo with orange badge */}
        <span className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-white shadow-sm shadow-accent/30">
            <Laptop className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span>
            IT<span className="text-accent-text">Majdoor</span>
          </span>
        </span>

        {/* Right: nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollToFeatures}
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)] md:inline-flex"
          >
            <HelpCircle size={15} strokeWidth={2.2} />
            How It Works
          </button>
          <button
            onClick={onOpenGuidelines}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            <BookOpen size={15} strokeWidth={2.2} className="text-accent" />
            Guidelines
          </button>
          <IconButton
            onClick={onToggleTheme}
            label="Toggle color theme"
            size="sm"
            icon={theme === "dark" ? Sun : Moon}
          />
        </div>
      </header>

      {/* Body / hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-6 py-16 text-center">
        {/* Headline */}
        <h1 className="flex animate-float items-center justify-center gap-3 text-6xl font-black leading-[1.15] tracking-tighter sm:text-7xl md:text-8xl">
          <Laptop
            className="h-16 w-16 shrink-0 text-accent sm:h-20 sm:w-20 md:h-28 md:w-28"
            strokeWidth={2}
          />
          {isDefaultHeadline ? (
            <span>
              <span className="text-[var(--text)]">IT</span>
              <span className="text-accent">Majdoor</span>
            </span>
          ) : (
            <span key={headline} className="whitespace-nowrap">
              <span className="text-[var(--text)]">{headline.split(" ")[0]}</span>{" "}
              <span className="text-accent">
                {headline.split(" ").slice(1).join(" ")}
              </span>
            </span>
          )}
        </h1>

        {/* Pill below the headline */}
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 font-mono text-xs text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Random 1-on-1 chat for IT folks
        </span>

        {/* Subtitle */}
        <p className="mt-6 max-w-xl text-sm text-[var(--muted)] sm:text-base">
          Get matched with a random IT worker for a quick video chat. Swap
          on-call horror stories, vent about sprint velocity, or just say hi —
          no logins, no pressure.
        </p>

        {/* CTA — orange button, black text with a white camera icon */}
        <button
          onClick={onJoin}
          className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-accent px-14 text-lg font-semibold text-black shadow-sm shadow-accent/25 transition-all hover:bg-accent-hover active:scale-[0.97]"
        >
          <Video size={22} strokeWidth={2.2} className="text-white" />
          Join ITMajdoor
          <ArrowRight size={22} strokeWidth={2.2} />
        </button>

        {/* CTA meta */}
        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--muted)]">
          <Zap size={13} className="text-accent" />
          <span className="text-accent">Instant Match</span>
          <span className="text-[var(--muted)]/50">•</span>
          Avg queue time: 4s
          <span className="text-[var(--muted)]/50">•</span>
          WebRTC P2P
        </p>
        <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">
          You'll be paired with someone waiting in the queue. Camera &amp; mic
          permissions required for audio/video.
        </p>

        {/* Terminal window with rotating confessions */}
        <QuoteRotator />

        {/* Feature strip */}
        <div
          id="how-it-works"
          className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 scroll-mt-24 sm:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-left transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <f.icon size={24} strokeWidth={2.2} />
              </span>
              <h2 className="mt-4 text-lg font-bold">{f.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-12 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[var(--border)] pt-8 font-mono text-xs text-[var(--muted)]">
          {TRUST.map((t) => (
            <span key={t.label} className="inline-flex items-center gap-2">
              <t.icon size={14} className="text-accent" strokeWidth={2.2} />
              {t.label}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-center text-sm text-[var(--muted)]">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <AlertTriangle size={15} className="text-accent" />
          Just for fun. Never share company credentials, production env keys, or
          proprietary IP.
          <button
            onClick={onOpenGuidelines}
            className="font-semibold text-accent-text underline underline-offset-2 hover:no-underline"
          >
            Read the guidelines
          </button>
        </p>
        <p className="mt-2 font-mono text-xs">
          Built with React + Node · Peer-to-peer WebRTC · No accounts, no data
          stored · © {new Date().getFullYear()} ITMajdoor. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
