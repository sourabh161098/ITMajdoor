import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageSquare, SendHorizontal, Hand, X } from "lucide-react";
import type { ChatMessage } from "../../hooks/useMajdoorSession";
import { IconButton } from "../ui/IconButton";

interface ChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled: boolean;
  /** Whether the chat panel is visible. Toggled from the session controls. */
  open: boolean;
  /** Close the panel (e.g. the X button inside the header). */
  onClose: () => void;
  /** True while the partner is typing; shows the typing bubble. */
  partnerTyping: boolean;
  /** Notify the partner that we started/stopped typing. */
  onTyping: (typing: boolean) => void;
}

/** Quick-start openers shown as tappable pills before the first message. */
const STARTER_MESSAGES = [
  "Hi Majdoor, how are you? 👋",
  "Which stack are you on these days? 💻",
  "Rough sprint or chill week? 😅",
];

/** Render an epoch-millis timestamp as a short local time, e.g. "6:05 PM". */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Chat({
  messages,
  onSend,
  disabled,
  open,
  onClose,
  partnerTyping,
  onTyping,
}: ChatProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Auto-scroll to the latest message (while the panel is open).
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Signal "started typing" (once), then debounce a "stopped typing" after a
  // short idle. Keeps traffic minimal: one event on start, one when idle.
  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 1500);
  };

  // Clean up the idle timer on unmount.
  useEffect(() => {
    return () => {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    };
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
    // We just sent; cancel any pending "stopped typing" (send already clears it).
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    isTypingRef.current = false;
  };

  return (
    <div
      aria-hidden={!open}
      className={`z-20 flex min-h-0 flex-col border-[var(--border)] bg-[var(--surface)] shadow-2xl
        absolute inset-y-0 right-0 w-full transition-transform duration-300 ease-out
        sm:static sm:h-full sm:shrink-0 sm:border-l sm:shadow-none sm:transition-[width]
        ${
          open
            ? "translate-x-0 sm:w-96 sm:border-l"
            : "pointer-events-none translate-x-full sm:translate-x-0 sm:w-0 sm:overflow-hidden sm:border-l-0"
        }`}
    >
      {/* Chat header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <MessageSquare size={18} className="text-accent" strokeWidth={2.2} />
        <h2 className="text-sm font-bold tracking-tight text-[var(--text)]">
          Chat
        </h2>
        <button
          onClick={onClose}
          aria-label="Close chat"
          title="Close chat"
          className="ml-auto grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="m-auto flex flex-col items-center text-center text-sm text-[var(--muted)]">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-2)]">
              <Hand size={22} className="text-accent" />
            </span>
            <p className="mt-3">
              {disabled
                ? "Waiting for a partner…"
                : "Break the ice with a quick hello:"}
            </p>
            {!disabled && (
              <div className="mt-4 flex flex-col items-center gap-2">
                {STARTER_MESSAGES.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => onSend(starter)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 active:scale-95 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/20"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.from === "me" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.from === "me"
                  ? "rounded-br-md bg-accent text-white"
                  : "rounded-bl-md bg-[var(--surface-2)] text-[var(--text)]"
              }`}
            >
              <span className="whitespace-pre-wrap break-words">{m.text}</span>
            </div>
            <span className="mt-1 px-1 text-[11px] text-[var(--muted)]">
              {formatTime(m.ts)}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Typing indicator: pinned just above the input, not inline in the list. */}
      {partnerTyping && (
        <div className="flex shrink-0 items-center gap-2 px-4 pt-1 mb-[5px]">
          <div className="flex items-center gap-0.5 rounded-xl rounded-bl-md bg-[var(--surface-2)] px-2 py-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" />
          </div>
        </div>
      )}

      {/* Input */}
      <form
        className="flex shrink-0 items-center gap-2 border-t border-[var(--border)] p-3"
        onSubmit={submit}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          placeholder={disabled ? "Waiting for a partner…" : "Type a message"}
          disabled={disabled}
          maxLength={2000}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        />
        <IconButton
          type="submit"
          disabled={disabled || !draft.trim()}
          variant="primary"
          label="Send message"
          icon={SendHorizontal}
        />
      </form>
    </div>
  );
}
