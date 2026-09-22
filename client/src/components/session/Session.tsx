import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SkipForward,
  PhoneOff,
  Sun,
  Moon,
  Laptop,
  MessageSquare,
  Smile,
} from "lucide-react";
import { useMajdoorSession } from "../../hooks/useMajdoorSession";
import { REACTION_EMOJIS } from "../../constants/session";
import type { Theme } from "../../hooks/useTheme";
import { Chat } from "./Chat";
import { VideoStage } from "./VideoStage";
import { IconButton } from "../ui/IconButton";

interface SessionProps {
  theme: Theme;
  onToggleTheme: () => void;
  /** Called when the user hits Stop (returns to the landing page). */
  onExit: () => void;
}

/**
 * The full in-call experience. Lazy-loaded, so socket.io-client and the
 * WebRTC logic in useMajdoorSession are only downloaded when a user joins,
 * keeping the initial landing bundle small.
 */
export function Session({ theme, onToggleTheme, onExit }: SessionProps) {
  const {
    status,
    messages,
    partnerTyping,
    quality,
    reactions,
    micOn,
    camOn,
    localVideoRef,
    remoteVideoRef,
    join,
    next,
    stop,
    sendMessage,
    setTyping,
    sendReaction,
    toggleMic,
    toggleCam,
  } = useMajdoorSession();

  // Chat panel is hidden by default; the chat button in the controls toggles it.
  const [chatOpen, setChatOpen] = useState(false);
  // Emoji reactions popover (kept compact so the control bar fits on mobile).
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Unread badge: counts ONLY messages received from the partner ("them")
  // while the chat panel is closed. Your own sent messages never count, and
  // opening the chat marks everything read (resets to 0). We track how many
  // received messages we've "seen" so far so the badge is accurate even after
  // opening/closing repeatedly.
  const [unreadCount, setUnreadCount] = useState(0);
  const seenReceivedRef = useRef(0);

  const receivedCount = messages.filter((m) => m.from === "them").length;

  useEffect(() => {
    if (chatOpen) {
      // Chat is open → everything received is considered read.
      seenReceivedRef.current = receivedCount;
      setUnreadCount(0);
    } else {
      // Chat is closed → anything received beyond what we've seen is unread.
      setUnreadCount(receivedCount - seenReceivedRef.current);
    }
  }, [receivedCount, chatOpen]);

  // A fresh partner resets the conversation, so clear the unread tracker too.
  useEffect(() => {
    if (status !== "connected") {
      seenReceivedRef.current = 0;
      setUnreadCount(0);
    }
  }, [status]);

  // Kick off matchmaking as soon as the session mounts.
  useEffect(() => {
    join();
  }, [join]);

  const connected = status === "connected";

  const handleStop = () => {
    stop();
    onExit();
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
        <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <Laptop className="h-5 w-5 text-accent" strokeWidth={2.4} />
          IT<span className="text-accent-text">Majdoor</span>
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              connected
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-accent/15 text-accent-text"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500" : "animate-pulse bg-accent"
              }`}
            />
            {status === "connected"
              ? "Connected"
              : status === "connecting"
              ? "Connecting…"
              : "Searching…"}
          </span>
          <IconButton
            onClick={onToggleTheme}
            label="Toggle color theme"
            size="sm"
            icon={theme === "dark" ? Sun : Moon}
          />
        </div>
      </header>

      {/* Stage: video always fills; chat slides in as a panel when opened. */}
      <main className="relative flex min-h-0 flex-1 flex-row overflow-hidden">
        <VideoStage
          status={status}
          quality={quality}
          reactions={reactions}
          micOn={micOn}
          camOn={camOn}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
        />
        <Chat
          messages={messages}
          onSend={sendMessage}
          disabled={!connected}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          partnerTyping={partnerTyping}
          onTyping={setTyping}
        />
      </main>

      {/* Controls */}
      <footer className="flex justify-center border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4">
        <div className="flex flex-nowrap items-center justify-center gap-2 rounded-[3rem] bg-[var(--bg)] px-4 py-3 shadow-inner sm:px-6">
          <IconButton
            onClick={toggleMic}
            label={micOn ? "Mute microphone" : "Unmute microphone"}
            variant={micOn ? "secondary" : "danger"}
            icon={micOn ? Mic : MicOff}
          />
          <IconButton
            onClick={toggleCam}
            label={camOn ? "Turn camera off" : "Turn camera on"}
            variant={camOn ? "secondary" : "danger"}
            icon={camOn ? Video : VideoOff}
          />
          {/* Chat toggle: shows/hides the chat panel. */}
          <div className="relative">
            <IconButton
              onClick={() => setChatOpen((o) => !o)}
              label={chatOpen ? "Hide chat" : "Show chat"}
              variant={chatOpen ? "primary" : "secondary"}
              icon={MessageSquare}
            />
            {!chatOpen && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[var(--bg)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          {/* Emoji reactions — a single button opens a popover, so the control
              bar stays compact and never overflows on mobile. */}
          <div className="relative">
            <IconButton
              onClick={() => setEmojiOpen((o) => !o)}
              disabled={!connected}
              label={emojiOpen ? "Hide reactions" : "Send a reaction"}
              variant={emojiOpen ? "primary" : "secondary"}
              icon={Smile}
            />
            {emojiOpen && connected && (
              <div className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 shadow-xl">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setEmojiOpen(false);
                    }}
                    aria-label={`Send ${emoji} reaction`}
                    title={`Send ${emoji}`}
                    className="grid h-10 w-10 place-items-center rounded-full text-xl transition-all hover:scale-125 hover:bg-[var(--surface-2)] active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mx-1 h-6 w-px bg-[var(--border)]" />

          {/* Always visible. Circular on small screens; a text label appears
              on large screens (the button naturally widens to fit it). */}
          <button
            onClick={next}
            aria-label="Next partner"
            title="Next partner"
            className="grid h-11 w-11 place-items-center rounded-full bg-accent font-semibold text-white shadow-sm shadow-accent/25 transition-all hover:bg-accent-hover active:scale-95"
          >
            <SkipForward size={19} strokeWidth={2.2} />
          </button>
          <button
            onClick={handleStop}
            aria-label="Stop and leave"
            title="Stop and leave"
            className="grid h-11 w-11 place-items-center rounded-full bg-red-500 font-semibold text-white shadow-sm shadow-red-500/25 transition-all hover:bg-red-600 active:scale-95"
          >
            <PhoneOff size={19} strokeWidth={2.2} />
          </button>
        </div>
      </footer>
    </div>
  );
}
