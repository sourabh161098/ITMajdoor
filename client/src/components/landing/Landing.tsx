import { useEffect, useState } from "react";
import {
  Video,
  Sun,
  Moon,
  ArrowRight,
  AlertTriangle,
  Laptop,
  BookOpen,
  Zap,
} from "lucide-react";
import type { Theme } from "../../hooks/useTheme";
import { QuoteRotator } from "./QuoteRotator";
import { DomainModal } from "./DomainModal";
import { IconButton } from "../ui/IconButton";
import {
  DEFAULT_HEADLINE,
  HEADLINE_CYCLE_MS,
  getHeroMood,
} from "../../constants/moodline";
import {
  LANDING_FEATURES,
  LANDING_TRUST,
  LANDING_COPY,
} from "../../constants/landing";

interface LandingProps {
  /** Called with the chosen domain id once the user confirms in the modal. */
  onJoin: (domainId: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenGuidelines: () => void;
}

export function Landing({
  onJoin,
  theme,
  onToggleTheme,
  onOpenGuidelines,
}: LandingProps) {
  // Domain picker modal shown when the user taps Join.
  const [domainOpen, setDomainOpen] = useState(false);

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
            IT<span className="text-accent">Majdoor</span>
          </span>
        </span>

        {/* Right: nav */}
        <div className="flex items-center gap-2">
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
          {LANDING_COPY.pill}
        </span>

        {/* Subtitle */}
        <p className="mt-6 max-w-xl text-sm text-[var(--muted)] sm:text-base">
          {LANDING_COPY.subtitle}
        </p>

        {/* CTA — opens the domain picker; joining happens after confirm. */}
        <button
          onClick={() => setDomainOpen(true)}
          className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-accent px-14 text-lg font-semibold text-black shadow-sm shadow-accent/25 transition-all hover:bg-accent-hover active:scale-[0.97]"
        >
          <Video size={22} strokeWidth={2.2} className="text-white" />
          {LANDING_COPY.cta}
          <ArrowRight size={22} strokeWidth={2.2} />
        </button>

        {/* CTA meta */}
        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--muted)]">
          <Zap size={13} className="text-accent" />
          <span className="text-accent">{LANDING_COPY.ctaMetaLead}</span>
          {LANDING_COPY.ctaMeta.map((item) => (
            <span key={item} className="contents">
              <span className="text-[var(--muted)]/50">•</span>
              {item}
            </span>
          ))}
        </p>
        <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">
          {LANDING_COPY.ctaHelper}
        </p>

        {/* Terminal window with rotating confessions */}
        <QuoteRotator />

        {/* Feature strip */}
        <div
          id="how-it-works"
          className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 scroll-mt-24 sm:grid-cols-3"
        >
          {LANDING_FEATURES.map((f) => (
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
          {LANDING_TRUST.map((t) => (
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
          {LANDING_COPY.footerDisclaimer}
          <button
            onClick={onOpenGuidelines}
            className="font-semibold text-accent underline underline-offset-2 hover:no-underline"
          >
            Read the guidelines
          </button>
        </p>
        <p className="mt-2 font-mono text-xs">
          {LANDING_COPY.footerCredit} · © {new Date().getFullYear()} ITMajdoor.
          All rights reserved.
        </p>
      </footer>

      {/* Domain picker — opens on Join, confirms with the chosen domain. */}
      <DomainModal
        open={domainOpen}
        onClose={() => setDomainOpen(false)}
        onConfirm={(domainId) => {
          setDomainOpen(false);
          onJoin(domainId);
        }}
      />
    </div>
  );
}
