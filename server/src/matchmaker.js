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
    // socketId -> true, for users waiting to be matched.
    // A Set preserves insertion order, but we pick randomly so order doesn't matter.
    this.waiting = new Set();

    // socketId -> partnerSocketId, for users currently in a paired session.
    this.partners = new Map();
  }

  /**
   * Add a user to the waiting pool and try to pair them immediately.
   * Returns the partner's socketId if a match was made, otherwise null.
   */
  join(socketId) {
    // If somehow already waiting or paired, clean up first to avoid duplicates.
    this.leave(socketId);

    const partnerId = this._pickWaitingPartner(socketId);
    if (partnerId) {
      this.waiting.delete(partnerId);
      this.partners.set(socketId, partnerId);
      this.partners.set(partnerId, socketId);
      return partnerId;
    }

    this.waiting.add(socketId);
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

  /** Pick a random waiting user who is not the joining user. */
  _pickWaitingPartner(socketId) {
    const candidates = [];
    for (const id of this.waiting) {
      if (id !== socketId) candidates.push(id);
    }
    if (candidates.length === 0) return null;
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }

  /** Simple stats, handy for debugging the local server. */
  stats() {
    return {
      waiting: this.waiting.size,
      pairedUsers: this.partners.size,
    };
  }
}
