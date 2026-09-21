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
 * Shows a random IT-Majdoor quote and rotates to the next one every 5 seconds
 * with a short cross-fade. Pauses while the browser tab is hidden.
 */
export function QuoteRotator() {
  // Start on a random quote so it feels fresh on each visit.
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * QUOTES.length)
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let swapTimer: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      // Fade out, swap to a random quote, then fade back in.
      setVisible(false);
      swapTimer = setTimeout(() => {
        setIndex((current) => pickRandomIndex(current));
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(swapTimer);
    };
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="mx-auto mt-10 w-full max-w-3xl">
      {/* macOS-style editor window — light terminal in light mode, dark in dark mode */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#1e1e2e] dark:shadow-2xl dark:ring-white/5">
        {/* Title bar with traffic-light buttons */}
        <div className="flex items-center gap-2 border-b border-black/10 bg-[#ececec] px-4 py-3 dark:border-white/10 dark:bg-[#2a2a3c]">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 select-none font-mono text-xs text-black/40 dark:text-white/40">
            majdoor@wisdom: ~/quotes.sh
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-[#fafafa] px-5 py-6 font-mono text-sm dark:bg-transparent sm:px-6 sm:py-7 sm:text-base">
          <div
            className="flex items-start gap-3 transition-opacity duration-300 ease-in-out"
            style={{ opacity: visible ? 1 : 0 }}
            aria-live="polite"
          >
            {/* Shell prompt */}
            <span aria-hidden className="select-none text-[#1a9e3f] dark:text-[#28c840]">
              $
            </span>
            <p className="leading-relaxed text-slate-800 dark:text-slate-100">
              <span aria-hidden className="text-black/30 dark:text-white/30">
                echo{" "}
              </span>
              <span className="italic text-slate-800 dark:text-slate-100">
                &ldquo;{quote}&rdquo;
              </span>
              {/* Blinking cursor */}
              <span
                aria-hidden
                className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-accent align-middle sm:h-5"
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
