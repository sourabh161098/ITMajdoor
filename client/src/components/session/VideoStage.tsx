import type { RefObject } from "react";
import { Loader2, VideoOff, MicOff, SwitchCamera } from "lucide-react";
import { Galaxy } from "./Galaxy";
import type {
  Status,
  ConnectionQuality,
  FloatingReaction,
} from "../../constants/session";

interface VideoStageProps {
  status: Status;
  quality: ConnectionQuality;
  reactions: FloatingReaction[];
  micOn: boolean;
  camOn: boolean;
  /** Whether the partner's camera is on (shows a placeholder when off). */
  partnerCamOn: boolean;
  /** When true, YOUR video is fullscreen and the partner is in the PiP corner. */
  swapped: boolean;
  /** Toggle which video is fullscreen (tapping the small PiP tile). */
  onSwap: () => void;
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
}

// Position classes for the fullscreen (main) video vs the small PiP corner.
const FULL = "absolute inset-0 h-full w-full";
// On mobile the PiP sits higher (bottom-24) so it clears the floating control
// bar (which spans most of the width). On larger screens the bar is centered
// with room to spare, so the PiP drops back to the bottom-right corner.
const PIP =
  "absolute bottom-28 right-4 z-10 aspect-[4/3] w-28 overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-2xl sm:bottom-4 sm:w-48";

// Signal-dot color + tooltip for each quality level.
const QUALITY_META: Record<
  ConnectionQuality,
  { color: string; label: string }
> = {
  good: { color: "bg-emerald-500", label: "Good connection" },
  ok: { color: "bg-amber-500", label: "Okay connection" },
  poor: { color: "bg-red-500", label: "Poor connection" },
  unknown: { color: "bg-white/40", label: "Measuring connection…" },
};

export function VideoStage({
  status,
  quality,
  reactions,
  micOn,
  camOn,
  partnerCamOn,
  swapped,
  onSwap,
  localVideoRef,
  remoteVideoRef,
}: VideoStageProps) {
  const q = QUALITY_META[quality];
  // When swapped, YOUR video takes the main slot and the partner goes to PiP.
  const remoteBox = swapped ? PIP : FULL;
  const localBox = swapped ? FULL : PIP;
  const canSwap = status === "connected";
  // Small swap icon shown on whichever tile is currently the PiP corner.
  const swapBadge = (
    <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-black/50 text-white ring-1 ring-white/15 backdrop-blur">
      <SwitchCamera size={13} strokeWidth={2.2} />
    </span>
  );
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-neutral-950">
      {/* Remote (partner) video */}
      <div
        className={`${remoteBox} bg-neutral-900 ${
          swapped && canSwap ? "cursor-pointer" : ""
        }`}
        onClick={swapped && canSwap ? onSwap : undefined}
      >
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
        {/* Partner camera-off placeholder (only meaningful once connected). */}
        {status === "connected" && !partnerCamOn && (
          <div className="absolute inset-0 grid place-items-center bg-neutral-900 text-white/50">
            <div className="flex flex-col items-center gap-2">
              <VideoOff size={swapped ? 20 : 40} />
              {!swapped && (
                <span className="text-sm font-medium">Camera off</span>
              )}
            </div>
          </div>
        )}
        {/* When the partner is the small PiP tile, show the swap badge. */}
        {swapped && canSwap && swapBadge}
        {/* Partner label + quality dot — full label only on the fullscreen tile.
            On the small PiP tile show just the quality dot to avoid crowding. */}
        {swapped ? (
          status === "connected" && (
            <span
              title={q.label}
              aria-label={q.label}
              className={`absolute left-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-black/40 ${q.color} ${
                quality === "poor" ? "animate-pulse" : ""
              }`}
            />
          )
        ) : (
          <span className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/40 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur-md">
            {status === "connected" && (
              <span
                title={q.label}
                aria-label={q.label}
                className={`h-2 w-2 shrink-0 rounded-full ${q.color} ${
                  quality === "poor" ? "animate-pulse" : ""
                }`}
              />
            )}
            Partner
          </span>
        )}
      </div>

      {/* Overlay while not connected — animated galaxy backdrop so it feels
          like we're scanning the universe for another IT Majdoor. */}
      {status !== "connected" && (
        <div className="absolute inset-0 overflow-hidden">
          <Galaxy />
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-4 text-center">
              {(status === "waiting" || status === "connecting") && (
                <Loader2
                  size={40}
                  className="animate-spin text-accent drop-shadow-[0_0_12px_rgba(255,138,0,0.5)]"
                />
              )}
              <p className="px-6 text-lg font-semibold text-white/80 drop-shadow-lg">
                {status === "waiting"
                  ? "Finding another IT Majdoor across the universe…"
                  : status === "connecting"
                  ? "Connecting you two…"
                  : "Not connected"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating emoji reactions from the partner — rise slowly from the
          bottom of the video up to the top, then fade out. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
        {reactions.map((r) => {
          // Small deterministic horizontal offset so stacked reactions spread.
          const offset = ((r.id.charCodeAt(0) % 11) - 5) * 14;
          return (
            <span
              key={r.id}
              className="absolute bottom-0 animate-reaction-float text-5xl drop-shadow-lg"
              style={{ transform: `translateX(${offset}px)` }}
            >
              {r.emoji}
            </span>
          );
        })}
      </div>

      {/* Local (you) — PiP corner normally, fullscreen when swapped */}
      <div
        className={`${localBox} bg-neutral-900 ${
          !swapped && canSwap ? "cursor-pointer" : ""
        }`}
        onClick={!swapped && canSwap ? onSwap : undefined}
      >
        {/* muted: never echo your own audio back to yourself */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />
        {/* When you're the small PiP tile, show the swap badge. */}
        {!swapped && canSwap && swapBadge}

        {/* Camera-off placeholder */}
        {!camOn && (
          <div className="absolute inset-0 grid place-items-center bg-neutral-900 text-white/50">
            <VideoOff size={swapped ? 40 : 24} />
          </div>
        )}

        {swapped ? (
          // Local is the fullscreen tile — label it top-left like the partner.
          <span className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/40 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur-md">
            You
            {!micOn && (
              <span className="grid h-4 w-4 place-items-center rounded bg-red-500 text-white">
                <MicOff size={10} />
              </span>
            )}
          </span>
        ) : (
          // Local is the small PiP tile — compact label at the bottom.
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5">
            <span className="rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              You
            </span>
            {!micOn && (
              <span className="grid h-5 w-5 place-items-center rounded-md bg-red-500 text-white">
                <MicOff size={12} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

