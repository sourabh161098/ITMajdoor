/**
 * In-memory matchmaking for ITMajdoor.
 *
 * Responsibilities:
 *  - Hold users who are waiting to be paired ("the queue").
 *  - Track which users are currently paired together ("rooms").
 *  - Pair two waiting users at random.
 *
 * There is no persistence. All state lives in these Maps/Sets and is lost when
 * the process restarts, which is exactly what we want for a local, DB-free app.
 */

export class Matchmaker {
  constructor() {
    // socketId -> { domain, since } for users waiting to be matched.
    // A Map preserves insertion order; `since` lets us relax matching over time.
    this.waiting = new Map();

    // socketId -> partnerSocketId, for users currently in a paired session.
    this.partners = new Map();

    // socketId -> last-known domain, so a re-queued partner keeps their choice.
    this.domains = new Map();
  }

  /** Last domain a socket used (for re-queuing an ex-partner). Defaults "all". */
  getDomain(socketId) {
    return this.domains.get(socketId) ?? "all";
  }

  /** Forget a socket entirely (call on disconnect) to avoid leaking domains. */
  forget(socketId) {
    this.domains.delete(socketId);
  }

  /**
   * Add a user to the waiting pool and try to pair them immediately.
   * `domain` is the interest area ("all" = match anyone). Returns the partner's
   * socketId if a match was made, otherwise null.
   */
  join(socketId, domain = "all") {
    // If somehow already waiting or paired, clean up first to avoid duplicates.
    this.leave(socketId);
    this.domains.set(socketId, domain);

    const partnerId = this._pickWaitingPartner(socketId, domain);
    if (partnerId) {
      this.waiting.delete(partnerId);
      this.partners.set(socketId, partnerId);
      this.partners.set(partnerId, socketId);
      return partnerId;
    }

    this.waiting.set(socketId, { domain, since: Date.now() });
    return null;
  }

  /**
   * Remove a user from the queue and/or their current pairing.
   * Returns the ex-partner's socketId if the user was paired, otherwise null.
   * The ex-partner is left un-paired (caller decides whether to re-queue them).
   */
  leave(socketId) {
    this.waiting.delete(socketId);

    const partnerId = this.partners.get(socketId);
    if (partnerId) {
      this.partners.delete(socketId);
      this.partners.delete(partnerId);
      return partnerId;
    }
    return null;
  }

  /** Return the current partner of a user, or null if they are not paired. */
  getPartner(socketId) {
    return this.partners.get(socketId) ?? null;
  }

  // After this long (ms) waiting without a domain match, a user is paired with
  // anyone so nobody is stuck forever when few people share their interest.
  static FALLBACK_MS = 15000;

  /**
   * Pick a waiting partner for a joining user, preferring a shared domain.
   *
   * Two users are a "domain match" if either picked "all", or they picked the
   * same domain. If no domain match exists, we relax to ANY waiting user once
   * either side has waited longer than FALLBACK_MS, so the queue keeps moving.
   */
  _pickWaitingPartner(socketId, domain) {
    const now = Date.now();
    const domainMatches = [];
    const anyMatches = [];

    for (const [id, info] of this.waiting) {
      if (id === socketId) continue;
      anyMatches.push(id);
      const shared =
        domain === "all" || info.domain === "all" || info.domain === domain;
      if (shared) domainMatches.push(id);
    }

    // Prefer a shared-domain partner.
    if (domainMatches.length > 0) {
      return domainMatches[Math.floor(Math.random() * domainMatches.length)];
    }

    // Otherwise, fall back to anyone who has waited long enough (or make the
    // joining user wait — they'll be picked up by a later join or their own
    // fallback when they eventually match).
    const relaxed = anyMatches.filter((id) => {
      const info = this.waiting.get(id);
      return info && now - info.since > Matchmaker.FALLBACK_MS;
    });
    if (relaxed.length > 0) {
      return relaxed[Math.floor(Math.random() * relaxed.length)];
    }

    return null;
  }

  /**
   * Periodically pair up users who have waited past the fallback window but
   * never got a domain match (e.g. two different specific domains, few users
   * online). Returns a list of newly-formed [a, b] pairs for the caller to
   * notify. Without this, such users could wait forever since matching only
   * runs on join/next events.
   */
  sweep() {
    const now = Date.now();
    // Only consider users who have exceeded the fallback window.
    const stale = [];
    for (const [id, info] of this.waiting) {
      if (now - info.since > Matchmaker.FALLBACK_MS) stale.push(id);
    }
    const pairs = [];
    // Pair them two at a time in FIFO order (longest-waiting first).
    while (stale.length >= 2) {
      const a = stale.shift();
      const b = stale.shift();
      // Both must still be waiting (defensive).
      if (!this.waiting.has(a) || !this.waiting.has(b)) continue;
      this.waiting.delete(a);
      this.waiting.delete(b);
      this.partners.set(a, b);
      this.partners.set(b, a);
      pairs.push([a, b]);
    }
    return pairs;
  }

  /** Simple stats, handy for debugging the local server. */
  stats() {
    return {
      waiting: this.waiting.size,
      pairedUsers: this.partners.size,
    };
  }
}
