import { useEffect, useRef } from "react";
import { Icon } from "./ui.jsx";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function NavItem({ icon: IconComp, label, current, badge, onClick, controls, expanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? "page" : undefined}
      aria-controls={controls}
      aria-expanded={expanded}
      className={`group relative flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
        current ? "bg-white/15 text-white" : "text-navy-200 hover:bg-white/10 hover:text-white"
      }`}
    >
      {current && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-300" />}
      <IconComp className={`h-5 w-5 flex-shrink-0 ${current ? "text-brand-300" : "text-navy-300 group-hover:text-white"}`} />
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold tabular-nums text-navy-900">
          {badge}
          <span className="sr-only"> need attention</span>
        </span>
      )}
    </button>
  );
}

// Enterprise navigation. Persistent on desktop; an off-canvas drawer below `lg`.
// A closed drawer is inert so it cannot be reached by keyboard or screen reader.
export default function Sidebar({ view, attentionCount, drawerOpen, isDesktop, aiOpen, onNavigate, onOpenAI, onClose }) {
  const ref = useRef(null);
  const closeRef = useRef(null);
  const hidden = !isDesktop && !drawerOpen;

  useEffect(() => {
    if (drawerOpen && !isDesktop) closeRef.current?.focus();
  }, [drawerOpen, isDesktop]);

  function onKeyDown(e) {
    if (isDesktop) return;
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = ref.current?.querySelectorAll(FOCUSABLE);
    if (!items || items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      {drawerOpen && !isDesktop && (
        <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-navy-950/60 lg:hidden" />
      )}
      <aside
        id="app-navigation"
        ref={ref}
        aria-label="Primary"
        aria-hidden={hidden}
        {...(hidden ? { inert: "" } : {})}
        onKeyDown={onKeyDown}
        className={`on-dark fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy-900 text-white shadow-pop transition-transform duration-200 lg:z-30 lg:translate-x-0 lg:shadow-none ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <Icon.Activity className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold tracking-tight">CareBridge</span>
              <span className="block text-xs text-navy-300">Referral orchestration</span>
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-200 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Icon.Close className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-navy-300">Workspace</p>
          <ul className="space-y-1">
            <li>
              <NavItem icon={Icon.Grid} label="Dashboard" current={view === "dashboard"} onClick={() => onNavigate("dashboard")} />
            </li>
            <li>
              <NavItem
                icon={Icon.List}
                label="Referrals"
                current={view === "referrals"}
                badge={attentionCount}
                onClick={() => onNavigate("referrals")}
              />
            </li>
          </ul>

          <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-navy-300">Assistant</p>
          <ul>
            <li>
              <NavItem
                icon={Icon.Spark}
                label="AI Coordinator"
                current={false}
                onClick={onOpenAI}
                controls="ai-coordinator-panel"
                expanded={aiOpen}
              />
            </li>
          </ul>
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 font-display text-sm font-bold text-white"
            >
              RH
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Rural Health Clinic</p>
              <p className="text-xs text-navy-300">Coordinator view</p>
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-navy-200">
            <Icon.Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-300" />
            Simulated demo. All patient data is fictional.
          </p>
        </div>
      </aside>
    </>
  );
}
