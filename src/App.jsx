import { useEffect, useRef, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import PatientJourney from "./components/PatientJourney.jsx";
import AICoordinator from "./components/AICoordinator.jsx";
import ApprovalModal from "./components/ApprovalModal.jsx";
import { Icon } from "./components/ui.jsx";
import { PATIENTS } from "./data/patients.js";
import { applyActionToPatient, getActionProposal, applyExternalEvent } from "./lib/actions.js";

// Deep-clone the seed data so we can safely edit patient state at runtime
// without mutating the original mock file.
function seedPatients() {
  return JSON.parse(JSON.stringify(PATIENTS));
}

export default function App() {
  const [patients, setPatients] = useState(seedPatients); // live, editable copy
  const [selectedPatient, setSelectedPatient] = useState(null); // patient id or null
  const [aiOpen, setAiOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null);

  // Human-in-the-loop approval modal state.
  const [approval, setApproval] = useState(null); // { patient, proposal }
  const [toast, setToast] = useState(null);

  const mainRef = useRef(null);
  const previousSelection = useRef(selectedPatient);

  // When switching between the dashboard and a patient, start at the top and move
  // keyboard/screen-reader focus to the new content. Comparing against the previous
  // selection (not a "first render" flag) keeps the initial load, and React
  // StrictMode's double-invoked effects, from stealing focus.
  useEffect(() => {
    if (previousSelection.current === selectedPatient) return;
    previousSelection.current = selectedPatient;
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [selectedPatient]);

  function openAIWith(question) {
    setPendingQuestion(question);
    setAiOpen(true);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only z-[80] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={() => setSelectedPatient(null)}
            aria-label="CareBridge, go to dashboard"
            className="-ml-1 flex items-center gap-2.5 rounded-lg p-1"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M4 12h4l2-5 3 10 2-5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-left">
              <span className="block text-base font-semibold leading-tight tracking-tight text-slate-900">CareBridge</span>
              <span className="block text-xs text-slate-600">Referral Orchestration</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 md:inline">Rural Health Clinic · Coordinator view</span>
            <button
              type="button"
              onClick={() => openAIWith(null)}
              aria-expanded={aiOpen}
              aria-controls="ai-coordinator-panel"
              className="btn btn-primary btn-sm"
            >
              <Icon.Spark className="h-4 w-4" />
              AI Coordinator
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" ref={mainRef} tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 focus:outline-none sm:px-6 sm:py-8">
        {selected ? (
          <PatientJourney
            patient={selected}
            onBack={() => setSelectedPatient(null)}
            onAskAI={openAIWith}
            onRequestAction={requestAction}
            onExternalEvent={externalEvent}
            onSimulateToast={showToast}
          />
        ) : (
          <Dashboard patients={patients} onSelectPatient={setSelectedPatient} />
        )}
      </main>

      {/* Footer disclaimer */}
      <footer className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-600">
          CareBridge is a cross-system coordination layer, not an EHR, a diagnostic tool, or a clinical
          decision-maker. All patient data and system integrations shown are simulated and fictional.
          Consequential actions require human approval. Clinical decisions remain with qualified healthcare professionals.
        </p>
      </footer>

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
          <div className="pointer-events-auto flex max-w-lg animate-fade-in items-start gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
            <Icon.Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
