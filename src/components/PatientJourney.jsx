import { useState } from "react";
import { JOURNEY_STEPS, ACTION_LABELS } from "../data/patients.js";
import { WORKFLOW_TONE, FHIR_ARCHITECTURE } from "../data/patients.js";
import { RiskBadge, StatusPill, WorkflowPill, SignalStateBadge, FhirBadge, Avatar, Icon, SIGNAL_ICON, SIGNAL_TONE } from "./ui.jsx";

const STATE_STYLES = {
  done: { ring: "bg-emerald-500 text-white", line: "bg-emerald-500", label: "text-slate-900", pill: "green", pillText: "Completed" },
  blocked: { ring: "bg-red-500 text-white", line: "bg-slate-200", label: "text-slate-900", pill: "red", pillText: "Blocked" },
  pending: { ring: "bg-slate-200 text-slate-400", line: "bg-slate-200", label: "text-slate-400", pill: "slate", pillText: "Pending" },
};

function StepIcon({ state }) {
  if (state === "done") return <Icon.Check className="h-4 w-4" />;
  if (state === "blocked") return <Icon.Block className="h-4 w-4" />;
  return <Icon.Clock className="h-4 w-4" />;
}

// ---- Connected Signals: shows the mock source systems feeding CareBridge ----
function ConnectedSignals({ patient }) {
  const [showArch, setShowArch] = useState(false);
  const active = patient.signals.filter((s) => (s.state || "active") === "active");
  const resolved = patient.signals.filter((s) => s.state === "resolved");
  const historical = patient.signals.filter((s) => s.state === "historical");

  const SignalCard = ({ sig }) => {
    const IconComp = SIGNAL_ICON[sig.system] || Icon.Doc;
    const tone = SIGNAL_TONE[sig.tone] || SIGNAL_TONE.neutral;
    const dim = sig.state === "resolved" || sig.state === "historical";
    return (
      <div className={`flex items-start gap-3 rounded-lg border ${tone.ring} bg-white p-3 ${dim ? "opacity-70" : ""}`}>
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
          <IconComp className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${tone.dot}`} />
              <span className={`text-sm font-medium ${dim ? "text-slate-500" : "text-slate-800"} ${sig.state === "historical" ? "line-through decoration-slate-300" : ""}`}>
                {sig.text}
              </span>
            </div>
            <SignalStateBadge state={sig.state || "active"} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Source: {sig.source}
            </span>
            {sig.fhir && <FhirBadge resource={sig.fhir} />}
          </div>
        </div>
      </div>
    );
  };

  const Group = ({ title, items }) =>
    items.length === 0 ? null : (
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((sig) => (
            <SignalCard key={sig.id} sig={sig} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-slate-900">Connected signals</h2>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200">
          FHIR-aligned simulated integration
        </span>
        <button
          onClick={() => setShowArch((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50"
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold">i</span>
          How CareBridge connects systems
        </button>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        CareBridge combines information that normally lives in separate, disconnected systems. Clinical signals are
        aligned to standard FHIR resources; operational signals (geography, transportation) keep their own source.
        Signals are kept as a timeline — active problems, items resolved, and historical context.
      </p>

      {showArch && <ArchitectureExplainer />}

      <div className="space-y-4">
        <Group title={`Active (${active.length})`} items={active} />
        <Group title={`Resolved (${resolved.length})`} items={resolved} />
        <Group title={`Historical (${historical.length})`} items={historical} />
      </div>
    </div>
  );
}

// ---- Compact "How CareBridge connects systems" explainer ----
function ArchitectureExplainer() {
  return (
    <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-700">
        How CareBridge connects systems
      </div>
      <div className="space-y-2">
        {FHIR_ARCHITECTURE.map((row) => (
          <div key={row.system} className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">{row.system}</span>
            <Icon.Chevron className="h-3 w-3 text-slate-400" />
            <FhirBadge resource={row.resource} />
            <Icon.Chevron className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-brand-700">CareBridge</span>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-800">Access / Geography · Transportation · Patient Intake</span>
          <Icon.Chevron className="h-3 w-3 text-slate-400" />
          <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            Operational signal
          </span>
          <Icon.Chevron className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-brand-700">CareBridge</span>
        </div>
      </div>

      <div className="mt-3 border-t border-indigo-100 pt-3 text-xs text-slate-600">
        <div className="font-semibold text-slate-800">CareBridge then:</div>
        <ul className="mt-1 space-y-0.5">
          <li>• detects cross-system referral exceptions</li>
          <li>• recommends an administrative action</li>
          <li>• a human approves consequential actions</li>
          <li>• continues monitoring for new external signals</li>
        </ul>
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        FHIR-aligned simulated integration for this prototype — not connected to Epic, not FHIR certified, and not a
        live payer integration. Existing systems remain the systems of record; CareBridge coordinates across them.
      </p>
    </div>
  );
}

// ---- Why this risk level? (expandable, rule-based) ----
function RiskExplainer({ patient }) {
  const [open, setOpen] = useState(false);
  const isLow = patient.risk === "Low";
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Icon.Alert className={`h-4 w-4 ${isLow ? "text-emerald-500" : "text-amber-500"}`} />
          Why this risk level?
        </span>
        <Icon.Chevron className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <RiskBadge level={patient.risk} />
            <span className="text-xs text-slate-400">Based on transparent operational rules — not a clinical prediction.</span>
          </div>
          <ul className="space-y-1.5">
            {patient.riskReasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isLow ? "bg-emerald-400" : "bg-amber-400"}`} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---- Referral Action Center ----
function ActionCenter({ patient, onRequestAction, onExternalEvent }) {
  const resolved = patient.barrierResolved === true;
  const actionTaken = patient.actionTaken === true;
  const ac = patient.actionCenter;

  // Fully resolved barrier (Sarah / David / Robert / Emily after loop closes).
  if (resolved) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <Icon.Check className="h-4 w-4" />
          {patient.loopClosed ? "Referral loop closed" : "Barrier resolved"}
        </div>
        <p className="mt-1 text-sm text-emerald-700">{patient.lastAction}</p>
        {!patient.loopClosed && (
          <p className="mt-2 text-sm text-emerald-700">
            Next step: confirm the patient completes the visit, then ensure the specialist information returns to the PCP.
          </p>
        )}
      </div>
    );
  }

  // Action taken but barrier still ACTIVE (Maria after escalation, Emily after note request).
  if (actionTaken) {
    const awaitingNote = patient.awaitingExternal === "specialist_note";
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
          <Icon.Clock className="h-4 w-4" /> Action in progress — barrier still active
        </div>
        <p className="mt-1 text-sm text-blue-700">{patient.lastAction}</p>
        <p className="mt-2 text-sm text-blue-700">
          Taking this action did not resolve the underlying problem. The barrier stays active until an external
          system responds.
        </p>

        {awaitingNote && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Demo control
              </span>
              <span className="text-xs font-medium text-slate-500">Simulated external event · no approval needed</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Facts arriving from other systems are not human decisions. Trigger the incoming signal to see CareBridge
              observe it and update the workflow.
            </p>
            <button
              onClick={() => onExternalEvent(patient.id, "specialist_note")}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Icon.Doc className="h-4 w-4" />
              Simulate incoming specialist note
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!ac) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="text-sm font-semibold text-slate-900">Referral Action Center</div>
        <p className="mt-1 text-sm text-slate-500">No intervention needed — this referral is on track.</p>
      </div>
    );
  }

  const Row = ({ label, value, tone }) => (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <p className={`mt-0.5 text-sm ${tone || "text-slate-700"}`}>{value}</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Icon.Spark className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold text-slate-900">Referral Action Center</h2>
      </div>
      <div className="space-y-3">
        <Row label="Detected problem" value={ac.problem} tone="text-slate-900 font-medium" />
        <Row label="Evidence" value={ac.evidence} />
        <Row label="Recommended action" value={ac.action} tone="text-brand-700 font-medium" />
        <Row label="Expected workflow effect" value={ac.effect} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <Icon.Alert className="h-4 w-4 flex-shrink-0 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">Human approval required to take this action</span>
      </div>

      <button
        onClick={() => onRequestAction(patient)}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        <Icon.Spark className="h-4 w-4" />
        Review &amp; approve: {ACTION_LABELS[patient.recommendedAction]}
      </button>
    </div>
  );
}

export default function PatientJourney({ patient, onBack, onAskAI, onRequestAction, onExternalEvent, onSimulateToast }) {
  if (!patient) return null;

  const completed = JOURNEY_STEPS.filter((s) => patient.journey[s.key] === "done").length;
  const progress = Math.round((completed / JOURNEY_STEPS.length) * 100);
  const resolved = patient.barrierResolved === true;

  // Contextual secondary actions. Once the specialist visit is complete, travel
  // actions no longer apply — swap in post-visit coordination actions instead.
  const visitComplete = patient.journey.visit_completed === "done";
  const secondaryActions = visitComplete
    ? [
        { icon: Icon.Phone, label: "Contact specialist office" },
        { icon: Icon.Doc, label: "Update PCP" },
        { icon: Icon.Clock, label: "View referral history" },
      ]
    : [
        { icon: Icon.Phone, label: "Contact patient" },
        { icon: Icon.Car, label: "Arrange transport" },
        { icon: Icon.Doc, label: "Update PCP" },
      ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back + header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <Icon.Chevron className="h-4 w-4 rotate-180" />
        Back to dashboard
      </button>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={patient.name} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
              <RiskBadge level={patient.risk} />
              <WorkflowPill status={patient.workflowStatus} tone={WORKFLOW_TONE[patient.workflowStatus]} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {patient.specialty} referral · placed {patient.referralDate} · PCP {patient.pcp}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-slate-400">Stalled</div>
            <div className="font-medium text-slate-700">
              {patient.stalledDays > 0 ? `${patient.stalledDays} days` : "Not stalled"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Distance</div>
            <div className="font-medium text-slate-700">
              {patient.distanceMiles === 0 ? "Telehealth" : `${patient.distanceMiles} miles`}
            </div>
          </div>
        </div>
      </div>

      {/* At-risk / resolved banner */}
      {/* Blocked / at risk — no action taken yet */}
      {patient.risk !== "Low" && !resolved && !patient.actionTaken && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <Icon.Alert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <div className="font-semibold text-red-800">
              Referral at risk{patient.blockingSystem ? ` · primary signal: ${patient.blockingSystem}` : ""}
            </div>
            <p className="mt-0.5 text-sm text-red-700">{patient.summary}</p>
          </div>
        </div>
      )}
      {/* Action taken but barrier still active (Maria / Emily step 1) */}
      {!resolved && patient.actionTaken && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Icon.Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
          <div>
            <div className="font-semibold text-blue-800">
              Action in progress · {patient.workflowStatus}
            </div>
            <p className="mt-0.5 text-sm text-blue-700">{patient.summary}</p>
          </div>
        </div>
      )}
      {/* Barrier fully resolved */}
      {resolved && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Icon.Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <div className="font-semibold text-emerald-800">
              {patient.workflowStatus === "Closed" ? "Referral closed" : "Referral back on track"}
            </div>
            <p className="mt-0.5 text-sm text-emerald-700">{patient.summary}</p>
          </div>
        </div>
      )}

      {/* Connected signals */}
      <ConnectedSignals patient={patient} />

      {/* Risk explainer */}
      <RiskExplainer patient={patient} />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Timeline */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Referral journey</h2>
            <span className="text-xs font-medium text-slate-400">{completed} of {JOURNEY_STEPS.length} complete</span>
          </div>

          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="relative">
            {JOURNEY_STEPS.map((step, i) => {
              const state = patient.journey[step.key] || "pending";
              const styles = STATE_STYLES[state];
              const isLast = i === JOURNEY_STEPS.length - 1;
              return (
                <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && <span className={`absolute left-[15px] top-8 h-full w-0.5 ${styles.line}`} aria-hidden />}
                  <span className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${styles.ring}`}>
                    <StepIcon state={state} />
                  </span>
                  <div className="pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${styles.label}`}>{step.label}</span>
                      <StatusPill tone={styles.pill}>{styles.pillText}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{patient.timelineNotes[step.key]}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Action center + secondary actions + AI shortcut */}
        <div className="lg:col-span-2 space-y-4">
          <ActionCenter patient={patient} onRequestAction={onRequestAction} onExternalEvent={onExternalEvent} />

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">Other coordinator actions</h2>
            <p className="mb-3 text-xs text-slate-400">Simulated. These do not change referral state in the prototype.</p>
            <div className="flex flex-wrap gap-2">
              {secondaryActions.map((a) => (
                <SecondaryAction
                  key={a.label}
                  icon={a.icon}
                  label={a.label}
                  onClick={() => onSimulateToast(`${a.label} — simulated for ${patient.name}.`)}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              onAskAI(
                resolved
                  ? `What should I do next for ${patient.name.split(" ")[0]}?`
                  : `What is blocking ${patient.name.split(" ")[0]}'s referral?`
              )
            }
            className="flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left transition hover:bg-brand-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Icon.Spark className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-brand-700">Ask the AI Coordinator</div>
              <div className="text-xs text-brand-600">
                {resolved ? "What's the next step for this referral?" : "Why is this referral at risk and what should I do?"}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function SecondaryAction({ icon: IconComp, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
    >
      <IconComp className="h-4 w-4" />
      {label}
    </button>
  );
}
