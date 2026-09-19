import { lazy, Suspense, useState } from "react";
import { useTheme } from "./hooks/useTheme";
import { Landing } from "./components/landing/Landing";

// Lazy-loaded routes. These pull in the heavier dependencies (socket.io-client,
// WebRTC logic, Headless UI) which the initial landing page does not need,
// so they are split into separate chunks fetched on demand.
const Session = lazy(() =>
  import("./components/session/Session").then((m) => ({ default: m.Session }))
);
const Guidelines = lazy(() =>
  import("./components/guidelines/Guidelines").then((m) => ({
    default: m.Guidelines,
  }))
);

type View = "landing" | "guidelines" | "session";

/** Minimal full-screen fallback shown while a lazy chunk loads. */
function Loader() {
  return (
    <div className="grid h-screen place-items-center bg-[var(--bg)]">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-accent" />
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<View>("landing");

  if (view === "session") {
    return (
      <Suspense fallback={<Loader />}>
        <Session
          theme={theme}
          onToggleTheme={toggleTheme}
          onExit={() => setView("landing")}
        />
      </Suspense>
    );
  }

  if (view === "guidelines") {
    return (
      <Suspense fallback={<Loader />}>
        <Guidelines
          onBack={() => setView("landing")}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    );
  }

  return (
    <Landing
      onJoin={() => setView("session")}
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenGuidelines={() => setView("guidelines")}
    />
  );
}
