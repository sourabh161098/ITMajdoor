import { Shuffle, Video, MessageSquare, Sun, Moon, ArrowRight, AlertTriangle, Laptop, BookOpen } from "lucide-react";
import type { Theme } from "../../hooks/useTheme";
import { QuoteRotator } from "./QuoteRotator";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

interface LandingProps {
  onJoin: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenGuidelines: () => void;
}

const FEATURES = [
  { icon: Shuffle, title: "Random match", desc: "Paired instantly with someone in the queue." },
  { icon: Video, title: "Live video", desc: "Peer-to-peer video and audio in the browser." },
  { icon: MessageSquare, title: "Text chat", desc: "Chat alongside the call, with timestamps." },
];

export function Landing({
  onJoin,
  theme,
  onToggleTheme,
  onOpenGuidelines,
}: LandingProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Ambient background glow (clipped in its own layer so it doesn't
          break the sticky header or cause horizontal scroll). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-6 py-4 backdrop-blur">
        <span className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Laptop className="h-6 w-6 text-accent" strokeWidth={2.4} />
          IT<span className="text-accent-text">Majdoor</span>
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={BookOpen}
            onClick={onOpenGuidelines}
            className="rounded-full"
          >
            Guidelines
          </Button>
          <IconButton
            onClick={onToggleTheme}
            label="Toggle color theme"
            size="sm"
            icon={theme === "dark" ? Sun : Moon}
          />
        </div>
      </header>

      {/* Body / hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="animate-rise-in flex items-center justify-center gap-3 bg-gradient-to-br from-[var(--text)] to-[var(--muted)] bg-clip-text text-6xl font-black leading-none tracking-tighter text-transparent sm:text-7xl md:text-8xl">
          {/* Laptop — the tool of every IT Majdoor, sized to match the text */}
          <Laptop
            className="animate-float h-16 w-16 shrink-0 text-accent sm:h-20 sm:w-20 md:h-28 md:w-28"
            strokeWidth={2}
          />
          <span>
            IT
            <span className="animate-gradient-pan bg-gradient-to-r from-accent via-amber-400 to-orange-600 bg-[length:200%_auto] bg-clip-text text-transparent">
              Majdoor
            </span>
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--muted)] sm:text-xl">
          Get matched with a random IT worker for a quick video chat. Swap
          stories, vent about work, or just say hi — no logins, no pressure.
        </p>

        <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs font-semibold text-[var(--muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Random 1-on-1 chat for IT folks
        </span>

        <Button
          onClick={onJoin}
          size="lg"
          iconRight={ArrowRight}
          className="mt-4 px-14 text-lg"
        >
          Join ITMajdoor
        </Button>

        <p className="mt-6 max-w-sm text-sm text-[var(--muted)]">
          You'll be paired with someone else waiting in the queue. Camera and
          mic access is required for video.
        </p>

        {/* Rotating IT-Majdoor quotes */}
        <QuoteRotator />

        {/* Feature strip */}
        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
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
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-center text-sm text-[var(--muted)]">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <AlertTriangle size={15} className="text-accent" />
          Just for fun. Never share company data, project details, or
          confidential info.
          <button
            onClick={onOpenGuidelines}
            className="font-semibold text-accent-text underline underline-offset-2 hover:no-underline"
          >
            Read the guidelines
          </button>
        </p>
        <p className="mt-2">
          Built with React + Node · Peer-to-peer WebRTC · No accounts, no data
          stored.
        </p>
        <p className="mt-1">© {new Date().getFullYear()} ITMajdoor</p>
      </footer>
    </div>
  );
}
