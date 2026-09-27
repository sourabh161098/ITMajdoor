import { useEffect, useState } from "react";
import { X, ArrowRight, Video } from "lucide-react";
import { DOMAINS } from "../../constants/session";

interface DomainModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen domain id when the user confirms. */
  onConfirm: (domainId: string) => void;
}

/**
 * Domain picker shown when the user taps "Join". They pick the area they work
 * in (or "All" to match with anyone), which is used for interest-based
 * matchmaking. Tailwind-only modal: responsive, scrollable, closes on Esc or
 * backdrop click.
 */
export function DomainModal({ open, onClose, onConfirm }: DomainModalProps) {
  const [selected, setSelected] = useState<string>("all");

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Select your domain"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, centered card on larger screens */}
      <div className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl animate-rise-in sm:m-6 sm:max-w-lg sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              What do you do? 
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Pick your area so we can match you with a like-minded IT Majdoor.
              Choose <span className="font-semibold text-accent">All</span> to
              meet anyone.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Domain pills (scrollable if they overflow) */}
        <div className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto p-6">
          {DOMAINS.map((d) => {
            const active = selected === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-95 ${
                  active
                    ? "border-accent bg-accent text-black shadow-sm shadow-accent/25"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-accent/40"
                }`}
              >
                <span aria-hidden>{d.emoji}</span>
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Footer / confirm — same styling as the landing "Join" button. */}
        <div className="shrink-0 border-t border-[var(--border)] p-4">
          <button
            onClick={() => onConfirm(selected)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent text-lg font-bold text-black shadow-sm shadow-accent/25 transition-all hover:bg-accent-hover active:scale-[0.98]"
          >
            <Video size={20} strokeWidth={2.2} className="text-white" />
            Join ITMajdoor
            <ArrowRight size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
