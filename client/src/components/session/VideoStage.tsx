import type { RefObject } from "react";
import { Loader2, VideoOff, MicOff } from "lucide-react";
import type { Status } from "../../hooks/useMajdoorSession";

interface VideoStageProps {
  status: Status;
  micOn: boolean;
  camOn: boolean;
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
}

export function VideoStage({
  status,
  micOn,
  camOn,
  localVideoRef,
  remoteVideoRef,
}: VideoStageProps) {
  return (
    <div className="relative min-h-0 flex-1 bg-neutral-950">
      {/* Remote (partner) video fills the stage */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      {/* Overlay while not connected */}
      {status !== "connected" && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-black">
          <div className="flex flex-col items-center gap-4 text-center">
            {(status === "waiting" || status === "connecting") && (
              <Loader2 size={40} className="animate-spin text-accent" />
            )}
            <p className="text-lg font-semibold text-white/70">
              {status === "waiting"
                ? "Finding another IT Majdoor for you…"
                : status === "connecting"
                ? "Connecting you two…"
                : "Not connected"}
            </p>
          </div>
        </div>
      )}

      {/* Partner label */}
      <span className="absolute left-4 top-4 rounded-lg bg-black/40 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur-md">
        Partner
      </span>

      {/* Local (you) picture-in-picture */}
      <div className="absolute bottom-4 right-4 aspect-[4/3] w-28 overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/15 shadow-2xl sm:w-48">
        {/* muted: never echo your own audio back to yourself */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />

        {/* Camera-off placeholder */}
        {!camOn && (
          <div className="absolute inset-0 grid place-items-center bg-neutral-900 text-white/50">
            <VideoOff size={24} />
          </div>
        )}

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
      </div>
    </div>
  );
}
