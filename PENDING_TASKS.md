# ITMajdoor — Pending Tasks & Feature Ideas

A backlog of features we could build next, grouped by effort. Realistic for the
current architecture (no database, in-memory server, WebRTC + Socket.IO).

---

## ✅ Completed

- **Connection quality indicator** — green/amber/red dot in front of the
  "Partner" badge, sampled from WebRTC `getStats()` every 3s.
- **Emoji reactions** — a smiley button opens a popover (👍😂🔥❤️👏😮); tapping
  one floats the emoji slowly up over the *partner's* video (sender doesn't see
  their own). Relayed via a `reaction` socket event.
- **Friday mood headline** — on Friday after 2 PM the landing hero alternates
  between "ITMajdoor" and "IT's Friday" every 5s (day-based, via
  `constants/moodline.ts`).

---

## Top 5 picks (best bang for the buck)

1. **Interest tags / topic match** — biggest engagement lever.
2. **Screen share** — IT-perfect, easy to add.
3. **Online / waiting count** — makes the app feel alive, nearly free.
4. **Report / block** — safety, needed before real traffic.
5. **Text-only vs video mode** — unlocks camera-shy users.

---

## Quick wins (small, high impact)

- [ ] **Online / waiting count** — show "N majdoors online" on landing + live
      "N waiting" in-session. Server already tracks this (`matchmaker.stats()`
      feeds `/health`); emit it over Socket.IO.
- [ ] **Report / block button** — report emits an event; block skips
      re-pairing with the same socket for the session.
- [ ] **Screen share** — one button, `getDisplayMedia()` + `replaceTrack()`.
      Great for sharing a stack trace / code.
- [x] **Connection quality indicator** — ✅ Done. Polls WebRTC `getStats()`
      every 3s (packet loss + RTT) and shows a green/amber/red dot in front of
      the "Partner" badge.
- [ ] **Copy chat transcript** — button to copy the conversation before it's
      gone (nothing is stored otherwise).
- [ ] **Keyboard shortcuts** — Esc = Stop, N = Next, M = mute, etc.

## Medium effort (differentiators)

- [ ] **Interest tags / topic match** — pick tags (frontend, DevOps, AI,
      job-hunting) and match on shared interests. Biggest engagement lever.
- [ ] **"Text only" vs "Video" mode** — lobby choice; matches respect the mode.
- [x] **Emoji reactions** — ✅ Done. Popover of emojis; floats over the
      partner's video. (Quick GIFs skipped — needs a GIF API + picker.)
- [ ] **Reconnect on network drop** — restore the same session on Wi-Fi↔data
      flips instead of dumping to the queue.
- [ ] **Nickname (ephemeral)** — optional session display name, no account.
      "Partner" → "Priya (Frontend)".

## Bigger / stretch

- [ ] **Shared code snippet pad** — tiny collaborative text area for pasting
      code during the chat, over the existing peer data channel.
- [ ] **Language / region preference** — match by preferred language.
- [ ] **Waiting-room mini-game or fun fact** — something to look at while
      "Finding another IT Majdoor…".
- [ ] **PWA / installable** — add to home screen, native-like on mobile.

## Operational / housekeeping

- [ ] **Rotate the leaked Twilio Auth Token** in the Twilio console, then update
      `TWILIO_AUTH_TOKEN` on Render. (Token was shared in plaintext during dev.)
- [ ] **Netlify Git auto-deploy** — connect the GitHub repo (base dir `client`)
      so `git push` auto-deploys the frontend.
- [ ] Rate limiting / abuse controls on the server.
