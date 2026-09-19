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
    <div className="mx-auto mt-10 w-full max-w-2xl">
      <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-8 py-7 shadow-sm">
        {/* Big decorative quotation mark */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1 select-none text-6xl leading-none text-accent/25"
        >
          &ldquo;
        </span>

        <div
          className="transition-opacity duration-300 ease-in-out"
          style={{ opacity: visible ? 1 : 0 }}
          aria-live="polite"
        >
          <p className="relative text-lg font-medium italic text-[var(--text)] sm:text-xl">
            {quote}
          </p>
        </div>
      </div>

    </div>
  );
}
