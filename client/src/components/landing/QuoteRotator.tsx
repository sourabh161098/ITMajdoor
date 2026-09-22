import { useEffect, useState } from "react";
import { QUOTES } from "../../constants/quotes";

const ROTATE_MS = 10000;
const FADE_MS = 400;

/** Pick a random quote index different from the one currently shown. */
function pickRandomIndex(current: number): number {
  if (QUOTES.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * QUOTES.length);
  }
  return next;
}

/**
 * Shows a random IT-Majdoor "confession" inside a macOS-style terminal window
 * and rotates to a new one automatically on a timer.
 */
export function QuoteRotator() {
  // Start on a random quote so it feels fresh on each visit.
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * QUOTES.length)
  );
  const [visible, setVisible] = useState(true);

  const rotate = () => {
    setVisible(false);
    setTimeout(() => {
      setIndex((current) => pickRandomIndex(current));
      setVisible(true);
    }, FADE_MS);
  };

  useEffect(() => {
    const interval = setInterval(rotate, ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="mx-auto mt-10 w-full max-w-3xl">
      {/* macOS-style terminal — light in light mode, dark in dark mode */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#1e1e2e] dark:shadow-2xl dark:ring-white/5">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-black/10 bg-[#ececec] px-4 py-2.5 dark:border-white/10 dark:bg-[#2a2a3c]">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 select-none font-mono text-xs text-black/40 dark:text-white/40">
            {"\u003E_ majdoor@wisdom: ~/quotes.sh"}
          </span>
          <span className="ml-auto hidden font-mono text-[11px] text-black/30 dark:text-white/30 sm:inline">
            bash (interactive)
          </span>
        </div>

        {/* Body */}
        <div
          className="space-y-2 bg-[#fafafa] px-5 py-6 text-left font-mono text-sm leading-relaxed transition-opacity duration-300 ease-in-out dark:bg-transparent sm:px-6"
          style={{ opacity: visible ? 1 : 0 }}
          aria-live="polite"
        >
          <p className="text-black/50 dark:text-white/50">
            <span className="text-accent">$</span> ./run-daily-standup-filter.sh{" "}
            <span className="text-black/30 dark:text-white/30">--mood=honest</span>
          </p>
          <p className="text-slate-800 dark:text-slate-100">
            <span className="text-black/40 dark:text-white/40">&gt; </span>
            <span className="italic">&ldquo;{quote}&rdquo;</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-black/60 dark:text-white/60">
            <span className="text-emerald-600 dark:text-emerald-400">#status:</span>
            <span className="text-black/50 dark:text-white/50">404 Hope Not Found</span>
            <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-accent align-middle" />
          </p>
        </div>
      </div>
    </div>
  );
}
