// Day-of-week "mood" for the landing hero headline.
//
// IT engineers love Friday, so the brand name gets a little personality:
//   - Friday after 2 PM:   alternates between "ITMajdoor" and "IT's Friday"
//                          every HEADLINE_CYCLE_MS
//   - Any other day/time:  plain "ITMajdoor"
//
// The headline keeps the laptop logo in all cases; only the text changes.

/** The default brand headline, rendered as "IT" + accent "Majdoor". */
export const DEFAULT_HEADLINE = "ITMajdoor";

/** How long each headline stays before alternating to the other, in ms. */
export const HEADLINE_CYCLE_MS = 5000;

/** Hour (24h) after which Friday's mood kicks in. */
const FRIDAY_MOOD_HOUR = 14; // 2 PM

export interface HeroMood {
  /** Headline text shown immediately on load. */
  initial: string;
  /**
   * If set, the headline alternates with this every HEADLINE_CYCLE_MS.
   * When null, the headline stays fixed on `initial`.
   */
  delayed: string | null;
}

/**
 * Decide the hero mood for a given moment (defaults to now). Kept pure and
 * date-injectable so it's easy to reason about and test.
 */
export function getHeroMood(now: Date = new Date()): HeroMood {
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ... 5 = Fri, 6 = Sat

  // Friday after 2 PM: start normal, then reveal the happy mood.
  if (day === 5 && now.getHours() >= FRIDAY_MOOD_HOUR) {
    return { initial: DEFAULT_HEADLINE, delayed: "IT's Friday" };
  }

  // Everything else: plain brand name.
  return { initial: DEFAULT_HEADLINE, delayed: null };
}
