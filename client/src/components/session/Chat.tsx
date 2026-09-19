import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageSquare, SendHorizontal, Hand } from "lucide-react";
import type { ChatMessage } from "../../hooks/useMajdoorSession";
import { IconButton } from "../ui/IconButton";

interface ChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled: boolean;
}

/** Render an epoch-millis timestamp as a short local time, e.g. "6:05 PM". */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Chat({ messages, onSend, disabled }: ChatProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col border-t border-[var(--border)] bg-[var(--surface)] md:w-96 md:flex-none md:border-l md:border-t-0">
      {/* Chat header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <MessageSquare size={18} className="text-accent" strokeWidth={2.2} />
        <h2 className="text-sm font-bold tracking-tight text-[var(--text)]">
          Chat
        </h2>
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="m-auto flex flex-col items-center text-center text-sm text-[var(--muted)]">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-2)]">
              <Hand size={22} className="text-accent" />
            </span>
            <p className="mt-3">Say hello to start the conversation.</p>
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

      {/* Input */}
      <form
        className="flex shrink-0 items-center gap-2 border-t border-[var(--border)] p-3"
        onSubmit={submit}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
