import { useEffect, useRef, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import Referrals from "./components/Referrals.jsx";
import PatientJourney from "./components/PatientJourney.jsx";
import AICoordinator from "./components/AICoordinator.jsx";
import ApprovalModal from "./components/ApprovalModal.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { Icon } from "./components/ui.jsx";
import { PATIENTS } from "./data/patients.js";
import { applyActionToPatient, getActionProposal, applyExternalEvent } from "./lib/actions.js";
import { DEFAULT_FILTER } from "./lib/filters.js";

// Deep-clone the seed data so we can safely edit patient state at runtime
// without mutating the original mock file.
function seedPatients() {
  return JSON.parse(JSON.stringify(PATIENTS));
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export default function App() {
  const [patients, setPatients] = useState(seedPatients); // live, editable copy
  const [view, setView] = useState("dashboard"); // "dashboard" | "referrals"
  const [selectedPatient, setSelectedPatient] = useState(null); // patient id or null
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [aiOpen, setAiOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Human-in-the-loop approval modal state.
  const [approval, setApproval] = useState(null); // { patient, proposal }
  const [toast, setToast] = useState(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const mainRef = useRef(null);
  const menuButtonRef = useRef(null);
  const screenKey = `${view}:${selectedPatient || ""}`;
  const previousScreen = useRef(screenKey);

  // When the screen changes, start at the top and move keyboard/screen-reader focus to
  // the new content. Comparing against the previous key (not a "first render" flag)
  // keeps the initial load, and React StrictMode's double effects, from stealing focus.
  useEffect(() => {
    if (previousScreen.current === screenKey) return;
    previousScreen.current = screenKey;
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [screenKey]);

  function closeDrawer({ restoreFocus = true } = {}) {
    setDrawerOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }

  function navigate(next) {
    setView(next);
    setSelectedPatient(null);
    if (drawerOpen) closeDrawer({ restoreFocus: false });
  }

  function openReferralsWith(filterKey) {
    setFilter(filterKey);
    navigate("referrals");
  }

  function openPatient(id) {
    setSelectedPatient(id);
    setView((v) => (v === "dashboard" ? "dashboard" : "referrals"));
  }

  function openAIWith(question) {
    setPendingQuestion(question);
    setAiOpen(true);
    if (drawerOpen) closeDrawer({ restoreFocus: false });
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  }

  // Step 1: a coordinator requests an action -> open the approval modal (no state change yet).
  function requestAction(patient) {
    const proposal = getActionProposal(patient);
    if (!proposal) return;
    setApproval({ patient, proposal });
  }

  // Step 2: the human approves -> NOW apply the state change.
  function approveAction() {
    if (!approval) return;
    const { patient, proposal } = approval;
    setPatients((prev) =>
      prev.map((p) => (p.id === patient.id ? applyActionToPatient(p, proposal.type) : p))
    );
    setApproval(null);
    showToast(`Approved: ${proposal.label} — ${patient.name}'s referral updated.`);
  }

  // External system event -> NO approval. CareBridge observes a signal from another
  // system and updates its workflow state. Facts received from external systems are
  // not human decisions, so no modal is shown.
  function externalEvent(patientId, eventType) {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? applyExternalEvent(p, eventType) : p))
    );
    showToast("Incoming signal received from Specialist EHR — workflow updated.");
  }

  const selected = patients.find((p) => p.id === selectedPatient) || null;
  const attentionCount = patients.filter((p) => p.risk !== "Low").length;

  // Breadcrumb trail for the header.
  const crumbs = [];
  if (view === "dashboard" && !selected) {
    crumbs.push({ label: "Dashboard" });
  } else if (view === "dashboard" && selected) {
    crumbs.push({ label: "Dashboard", onClick: () => navigate("dashboard") }, { label: selected.name });
  } else if (selected) {
    crumbs.push({ label: "Referrals", onClick: () => navigate("referrals") }, { label: selected.name });
  } else {
    crumbs.push({ label: "Referrals" });
  }

  return (
    <div className="min-h-screen bg-canvas lg:pl-64">
      <a
        href="#main-content"
        className="sr-only z-[80] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <Sidebar
        view={view}
        attentionCount={attentionCount}
        drawerOpen={drawerOpen}
        isDesktop={isDesktop}
        aiOpen={aiOpen}
        onNavigate={navigate}
        onOpenAI={() => openAIWith(null)}
        onClose={() => closeDrawer()}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="app-navigation"
              className="btn btn-ghost -ml-2 h-10 w-10 !min-h-0 !p-0 lg:hidden"
            >
              <Icon.Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1.5 text-sm">
                {crumbs.map((c, i) => (
                  <li key={c.label} className="flex min-w-0 items-center gap-1.5">
                    {i > 0 && <Icon.Chevron className="h-4 w-4 flex-shrink-0 text-slate-400" />}
                    {c.onClick ? (
                      <button type="button" onClick={c.onClick} className="rounded font-medium text-slate-600 hover:text-brand-700 hover:underline">
                        {c.label}
                      </button>
                    ) : (
                      <span aria-current="page" className="truncate font-semibold text-navy-900">
                        {c.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 md:inline-flex">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Simulated demo data
            </span>
            <button
              type="button"
              onClick={() => openAIWith(null)}
              aria-expanded={aiOpen}
              aria-controls="ai-coordinator-panel"
              className="btn btn-primary btn-sm"
            >
              <Icon.Spark className="h-4 w-4" />
              <span className="hidden sm:inline">AI Coordinator</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-[1560px] px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8 2xl:px-10"
      >
        {selected ? (
          <PatientJourney
            patient={selected}
            backLabel={view === "dashboard" ? "Back to dashboard" : "Back to referrals"}
            onBack={() => setSelectedPatient(null)}
            onAskAI={openAIWith}
            onRequestAction={requestAction}
            onExternalEvent={externalEvent}
            onSimulateToast={showToast}
          />
        ) : view === "dashboard" ? (
          <Dashboard patients={patients} onSelectPatient={openPatient} onOpenReferrals={openReferralsWith} />
        ) : (
          <Referrals patients={patients} filter={filter} onFilter={setFilter} onSelectPatient={openPatient} />
        )}

        <footer className="mt-10">
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-600">
            CareBridge is a cross-system coordination layer, not an EHR, a diagnostic tool, or a clinical
            decision-maker. All patient data and system integrations shown are simulated and fictional.
            Consequential actions require human approval. Clinical decisions remain with qualified healthcare professionals.
          </p>
        </footer>
      </main>

      {/* AI side panel */}
      <AICoordinator
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        pendingQuestion={pendingQuestion}
        onConsumed={() => setPendingQuestion(null)}
        patients={patients}
      />

      {/* Human-in-the-loop approval */}
      <ApprovalModal
        open={!!approval}
        patient={approval?.patient}
        proposal={approval?.proposal}
        onApprove={approveAction}
        onCancel={() => setApproval(null)}
      />

      {/* Global toast: the live region stays mounted so announcements are reliable. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
      >
        {toast && (
          <div className="pointer-events-auto flex max-w-lg animate-fade-in items-start gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-medium text-white shadow-pop">
            <Icon.Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
