import { ArrowLeft, Sun, Moon, AlertTriangle, Laptop } from "lucide-react";
import type { Theme } from "../../hooks/useTheme";
import { Accordion, type AccordionItem } from "./Accordion";
import { IconButton } from "../ui/IconButton";

interface GuidelinesProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const items: AccordionItem[] = [
  {
    id: "fun",
    icon: "🎉",
    title: "This is just for fun",
    content: (
      <div className="space-y-3">
        <p>
          ITMajdoor exists for one reason: to have a good time and meet other
          people who live the IT life. Think of it as a virtual chai break where
          you bump into a random engineer from another company and swap stories.
        </p>
        <p>
          There are no accounts, no profiles, and nothing is saved. When your
          chat ends, it's gone. Talk about your favorite framework, complain
          about flaky tests, argue about tabs vs spaces, or just wave hi.
        </p>
        <p className="font-semibold text-[var(--text)]">
          It is <span className="text-accent-text">not</span> a professional network,
          a recruiting tool, or a place to do business. Keep it light.
        </p>
      </div>
    ),
  },
  {
    id: "connect",
    icon: "🤝",
    title: "Connect with fellow IT engineers",
    content: (
      <div className="space-y-3">
        <p>
          The whole point is meeting engineers from other companies. Everyone
          here works in tech somewhere, so you already share a language: broken
          builds, endless standups, and that one Jira ticket that never dies.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Trade war stories about production incidents (no specifics!).</li>
          <li>Compare tech stacks, tools, and workflows.</li>
          <li>Share career tips, learning resources, and hobbies.</li>
          <li>Make a new friend in the industry.</li>
        </ul>
        <p>
          Be kind, be curious, and treat the stranger on the other end the way
          you'd want a stranger to treat you.
        </p>
      </div>
    ),
  },
  {
    id: "no-company-data",
    icon: "🔒",
    title: "Never share company data",
    content: (
      <div className="space-y-3">
        <p className="font-semibold text-[var(--text)]">
          This is the one rule that really matters. Do not share anything that
          belongs to your employer or client.
        </p>
        <p>That includes, but is not limited to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Source code, snippets, repositories, or architecture diagrams.</li>
          <li>Customer data, user records, or any personal information (PII).</li>
          <li>Credentials, API keys, tokens, passwords, or access details.</li>
          <li>Internal documents, roadmaps, financials, or contracts.</li>
          <li>Server names, IP addresses, or infrastructure details.</li>
        </ul>
        <p>
          Remember: the person on the other side is an anonymous stranger. What
          feels like a harmless detail can be a real leak. When in doubt, leave
          it out.
        </p>
      </div>
    ),
  },
  {
    id: "no-project-details",
    icon: "🧩",
    title: "Never share project or business details",
    content: (
      <div className="space-y-3">
        <p>
          Keep unreleased and confidential work to yourself. Sharing project
          details can breach your NDA and get you (and others) in serious
          trouble.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Unreleased features, launch dates, or product plans.</li>
          <li>Client names, deal terms, or partnership details.</li>
          <li>Internal metrics, revenue, or growth numbers.</li>
          <li>Security practices, vulnerabilities, or incident details.</li>
        </ul>
        <p>
          You can absolutely talk about <em>technology</em> in general. Just
          don't attach it to your specific company, client, or project.
        </p>
      </div>
    ),
  },
  {
    id: "no-data-stored",
    icon: "🕵️",
    title: "We don't store your data",
    content: (
      <div className="space-y-3">
        <p className="font-semibold text-[var(--text)]">
          ITMajdoor keeps nothing. There are no accounts and no database.
        </p>
        <p>Specifically, we do not record, save, or store:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Your video or audio — the call is peer-to-peer between you and your partner.</li>
          <li>Any images, screenshots, or camera snapshots.</li>
          <li>Your chat messages — they're relayed live and never written to disk.</li>
          <li>Your identity — no name, email, or login is ever collected.</li>
        </ul>
        <p>
          Once you hit “Next” or “Stop”, the conversation is gone for good.
          Nothing is logged and nothing can be replayed.
        </p>
        <p className="text-sm">
          That said, remember the <em>other person</em> could still record their
          own screen. Treat every conversation as if it could be seen by
          someone else.
        </p>
      </div>
    ),
  },
  {
    id: "stay-safe",
    icon: "🛡️",
    title: "Stay safe & be respectful",
    content: (
      <div className="space-y-3">
        <p>
          Protect your own privacy too. Don't share personal contact info,
          home address, or financial details with strangers.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>No harassment, hate speech, or explicit content.</li>
          <li>If a conversation gets uncomfortable, hit “Next” or “Stop”.</li>
          <li>Assume anything on camera or in chat could be recorded.</li>
        </ul>
        <p className="font-semibold text-[var(--text)]">
          By using ITMajdoor you agree to keep it fun, safe, and respectful for
          everyone.
        </p>
      </div>
    ),
  },
];

export function Guidelines({ onBack, theme, onToggleTheme }: GuidelinesProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Ambient background glow (matches the landing page). Clipped in its own
          fixed layer so it doesn't break the sticky header or cause scroll. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/90 px-6 py-4 backdrop-blur">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-2xl font-extrabold tracking-tight transition hover:opacity-80"
        >
          <Laptop className="h-6 w-6 text-accent" strokeWidth={2.4} />
          IT<span className="text-accent">Majdoor</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            <ArrowLeft size={15} strokeWidth={2.2} className="text-accent" />
            Back
          </button>
          <IconButton
            onClick={onToggleTheme}
            label="Toggle color theme"
            size="sm"
            icon={theme === "dark" ? Sun : Moon}
          />
        </div>
      </header>

      {/* Body */}
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Guidelines &amp; <span className="text-accent-text">Disclaimer</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">
            The short version: have fun, be kind, and never share anything that
            belongs to your company. Tap a card to read more.
          </p>
        </div>

        {/* Highlighted disclaimer banner */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-left">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-base font-semibold">
            ITMajdoor is built purely for fun and to connect with other IT
            engineers. Never share company data, project details, or any
            confidential information.
          </p>
        </div>

        <Accordion items={items} defaultOpen={0} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-center text-sm text-[var(--muted)]">
        <p>Play nice. What's shared here is your responsibility.</p>
        <p className="mt-1">© {new Date().getFullYear()} ITMajdoor</p>
      </footer>
    </div>
  );
}
