import { useState } from "react";
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
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M4 12h4l2-5 3 10 2-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="text-left">
              <div className="text-base font-bold tracking-tight text-slate-900">CareBridge</div>
              <div className="-mt-0.5 text-[11px] font-medium text-slate-400">Referral Orchestration</div>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">Rural Health Clinic · Coordinator view</span>
            <button
              onClick={() => openAIWith(null)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              <Icon.Spark className="h-4 w-4" />
              AI Coordinator
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-400">
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

      {/* Global toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 animate-fade-in rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
