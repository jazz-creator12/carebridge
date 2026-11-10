import { useId, useState } from "react";
import { JOURNEY_STEPS, ACTION_LABELS, WORKFLOW_TONE, FHIR_ARCHITECTURE } from "../data/patients.js";
import { orderJourneySteps } from "../lib/journey.js";
import {
  RiskBadge,
  StatusPill,
  WorkflowPill,
  SignalStateBadge,
  FhirBadge,
  Avatar,
  Icon,
  SIGNAL_ICON,
  SIGNAL_TONE,
} from "./ui.jsx";

// Journey step states: icon + word + color (never color alone).
const STEP_STYLES = {
  done: { ring: "bg-emerald-600 text-white", line: "bg-emerald-600", pill: "green", pillText: "Completed" },
  blocked: { ring: "bg-red-600 text-white", line: "bg-slate-200", pill: "red", pillText: "Blocked" },
  pending: { ring: "border-2 border-slate-300 bg-white text-slate-600", line: "bg-slate-200", pill: "slate", pillText: "Pending" },
};

function StepIcon({ state }) {
  if (state === "done") return <Icon.Check className="h-4 w-4" />;
  if (state === "blocked") return <Icon.Block className="h-4 w-4" />;
  return <Icon.Clock className="h-4 w-4" />;
}

// ---- One concise status banner (replaces three separate banners) ----
function StatusBanner({ patient, resolved }) {
  let tone;
  if (resolved) {
    tone = {
      box: "border-emerald-200 bg-emerald-50",
      icon: <Icon.Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" />,
      title: patient.workflowStatus === "Closed" ? "Referral closed" : "Referral back on track",
      titleCls: "text-emerald-900",
    };
  } else if (patient.actionTaken) {
    tone = {
      box: "border-brand-200 bg-brand-50",
      icon: <Icon.Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />,
      title: `Action in progress · ${patient.workflowStatus}`,
      titleCls: "text-brand-900",
    };
  } else if (patient.risk !== "Low") {
    tone = {
      box: "border-red-200 bg-red-50",
      icon: <Icon.Alert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />,
      title: `Referral at risk${patient.blockingSystem ? ` · primary signal: ${patient.blockingSystem}` : ""}`,
      titleCls: "text-red-900",
    };
  } else {
    return null;
  }
  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 ${tone.box}`}>
      {tone.icon}
      <div>
        <h2 className={`text-sm font-semibold ${tone.titleCls}`}>{tone.title}</h2>
        <p className="mt-0.5 text-sm text-slate-800">{patient.summary}</p>
      </div>
    </div>
  );
}

// ---- Connected Signals: shows the mock source systems feeding CareBridge ----
function ConnectedSignals({ patient }) {
  const [showArch, setShowArch] = useState(false);
  const archId = useId();
  const active = patient.signals.filter((s) => (s.state || "active") === "active");
  const resolved = patient.signals.filter((s) => s.state === "resolved");
  const historical = patient.signals.filter((s) => s.state === "historical");

  const barByState = (sig) => {
    if (sig.state === "resolved") return "border-l-emerald-600";
    if (sig.state === "historical") return "border-l-slate-400";
    return (SIGNAL_TONE[sig.tone] || SIGNAL_TONE.neutral).bar;
  };

  const SignalCard = ({ sig }) => {
    const IconComp = SIGNAL_ICON[sig.system] || Icon.Doc;
    const tone = SIGNAL_TONE[sig.tone] || SIGNAL_TONE.neutral;
    return (
      <li className={`flex items-start gap-3 rounded-lg border border-l-4 border-slate-200 bg-white p-3 ${barByState(sig)}`}>
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
          <IconComp className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">{sig.text}</p>
            <SignalStateBadge state={sig.state || "active"} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs text-slate-600">Source: {sig.source}</span>
            {sig.fhir && <FhirBadge resource={sig.fhir} />}
          </div>
        </div>
      </li>
    );
  };

  const Group = ({ title, items }) =>
    items.length === 0 ? null : (
      <div>
        <h3 className="label-caps mb-2">{title}</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((sig) => (
            <SignalCard key={sig.id} sig={sig} />
          ))}
        </ul>
      </div>
    );

  return (
    <section aria-labelledby="signals-heading" className="card p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 id="signals-heading" className="text-base font-semibold text-slate-900">
          Connected signals
        </h2>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800 ring-1 ring-inset ring-teal-200">
          FHIR-aligned simulated integration
        </span>
        <button
          type="button"
          aria-expanded={showArch}
          aria-controls={archId}
          onClick={() => setShowArch((v) => !v)}
          className="btn btn-secondary btn-sm ml-auto"
        >
          How CareBridge connects systems
          <Icon.Chevron className={`h-4 w-4 transition-transform ${showArch ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-600">
        CareBridge combines information that normally lives in separate systems. Clinical signals align to standard
        FHIR resources; operational signals (geography, transportation) keep their own source. Signals are kept as a
        timeline: active problems, items resolved, and historical context.
      </p>

      {showArch && <ArchitectureExplainer id={archId} />}

      <div className="space-y-5">
        <Group title={`Active (${active.length})`} items={active} />
        <Group title={`Resolved (${resolved.length})`} items={resolved} />
        <Group title={`Historical (${historical.length})`} items={historical} />
      </div>
    </section>
  );
}

// ---- Compact "How CareBridge connects systems" explainer ----
function ArchitectureExplainer({ id }) {
  return (
    <div id={id} className="mb-5 rounded-lg border border-teal-200 bg-teal-50/60 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-800">How CareBridge connects systems</h3>
      <ul className="space-y-2">
        {FHIR_ARCHITECTURE.map((row) => (
          <li key={row.system} className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">{row.system}</span>
            <Icon.ArrowRight className="h-4 w-4 text-slate-500" />
            <FhirBadge resource={row.resource} />
            <Icon.ArrowRight className="h-4 w-4 text-slate-500" />
            <span className="font-semibold text-brand-800">CareBridge</span>
          </li>
        ))}
        <li className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <span className="font-medium text-slate-900">Access / Geography · Transportation · Patient Intake</span>
          <Icon.ArrowRight className="h-4 w-4 text-slate-500" />
          <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700">
            Operational signal
          </span>
          <Icon.ArrowRight className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-brand-800">CareBridge</span>
        </li>
      </ul>

      <div className="mt-3 border-t border-teal-200 pt-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">CareBridge then:</div>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>detects cross-system referral exceptions</li>
          <li>recommends an administrative action</li>
          <li>a human approves consequential actions</li>
          <li>continues monitoring for new external signals</li>
        </ul>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        FHIR-aligned simulated integration for this prototype. Not connected to Epic, not FHIR certified, and not a
        live payer integration. Existing systems remain the systems of record; CareBridge coordinates across them.
      </p>
    </div>
  );
}

// ---- Why this risk level? (expandable, rule-based) ----
function RiskExplainer({ patient }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const isLow = patient.risk === "Low";
  return (
    <section className="card">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl px-5 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Icon.Alert className={`h-4 w-4 ${isLow ? "text-emerald-700" : "text-amber-700"}`} />
            Why this risk level?
          </span>
          <Icon.Chevron className={`h-4 w-4 text-slate-600 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </h2>
      {open && (
        <div id={panelId} className="border-t border-slate-200 px-5 py-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <RiskBadge level={patient.risk} />
            <span className="text-xs text-slate-600">Transparent operational rules, not a clinical prediction.</span>
          </div>
          <ul className="space-y-1.5">
            {patient.riskReasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-slate-800">
                <span
                  aria-hidden="true"
                  className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isLow ? "bg-emerald-600" : "bg-amber-600"}`}
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
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
      <section aria-labelledby="action-heading" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 id="action-heading" className="flex items-center gap-2 text-base font-semibold text-emerald-900">
          <Icon.Check className="h-5 w-5" />
          {patient.loopClosed ? "Referral loop closed" : "Barrier resolved"}
        </h2>
        <p className="mt-2 text-sm text-slate-800">{patient.lastAction}</p>
        {!patient.loopClosed && (
          <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm font-medium text-slate-900">
            {patient.nextStepOverride ||
              "Next step: confirm the patient completes the visit, then ensure the specialist information returns to the PCP."}
          </p>
        )}
      </section>
    );
  }

  // Action taken but barrier still ACTIVE (Maria after escalation, Emily after note request).
  if (actionTaken) {
    const awaitingNote = patient.awaitingExternal === "specialist_note";
    return (
      <section aria-labelledby="action-heading" className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <h2 id="action-heading" className="flex items-center gap-2 text-base font-semibold text-brand-900">
          <Icon.Clock className="h-5 w-5" />
          Action in progress, barrier still active
        </h2>
        <p className="mt-2 text-sm text-slate-800">{patient.lastAction}</p>
        <p className="mt-2 text-sm text-slate-700">
          Taking this action did not resolve the underlying problem. The barrier stays active until an external
          system responds.
        </p>

        {awaitingNote && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-400 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                Demo control
              </span>
              <span className="text-xs font-medium text-slate-700">Simulated external event · no approval needed</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              Facts arriving from other systems are not human decisions. Trigger the incoming signal to see CareBridge
              observe it and update the workflow.
            </p>
            <button
              type="button"
              onClick={() => onExternalEvent(patient.id, "specialist_note")}
              className="btn btn-secondary mt-3 w-full"
            >
              <Icon.Doc className="h-4 w-4" />
              Simulate incoming specialist note
            </button>
          </div>
        )}
      </section>
    );
  }

  if (!ac) {
    return (
      <section aria-labelledby="action-heading" className="card p-5">
        <h2 id="action-heading" className="text-base font-semibold text-slate-900">
          Referral Action Center
        </h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
          <Icon.Check className="h-4 w-4 text-emerald-700" />
          No intervention needed. This referral is on track.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="action-heading" className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Icon.Spark className="h-4 w-4" />
        </span>
        <h2 id="action-heading" className="text-base font-semibold text-slate-900">
          Referral Action Center
        </h2>
      </div>
      <dl className="space-y-3">
        <div>
          <dt className="label-caps">Detected problem</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900">{ac.problem}</dd>
        </div>
        <div>
          <dt className="label-caps">Evidence</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{ac.evidence}</dd>
        </div>
        <div className="rounded-lg bg-brand-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-brand-800">Recommended action</dt>
          <dd className="mt-0.5 text-sm font-semibold text-brand-900">{ac.action}</dd>
        </div>
        <div>
          <dt className="label-caps">Expected workflow effect</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{ac.effect}</dd>
        </div>
      </dl>

      <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
        <Icon.Alert className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Human approval required to take this action
      </p>

      <button type="button" onClick={() => onRequestAction(patient)} className="btn btn-primary btn-lg mt-3 w-full">
        <Icon.Spark className="h-4 w-4" />
        Review &amp; approve: {ACTION_LABELS[patient.recommendedAction]}
      </button>
    </section>
  );
}

export default function PatientJourney({ patient, onBack, onAskAI, onRequestAction, onExternalEvent, onSimulateToast }) {
  if (!patient) return null;

  const completed = JOURNEY_STEPS.filter((s) => patient.journey[s.key] === "done").length;
  const progress = Math.round((completed / JOURNEY_STEPS.length) * 100);
  const resolved = patient.barrierResolved === true;

  // DISPLAY-ONLY ordering (see lib/journey.js): reads patient.journey, never changes it.
  const orderedSteps = orderJourneySteps(patient.journey, JOURNEY_STEPS);
  const currentIndex = orderedSteps.findIndex((s) => patient.journey[s.key] !== "done");

  // Contextual secondary actions. These never change referral state; we only hide
  // ones that are obviously irrelevant given the current state.
  const visitComplete = patient.journey.visit_completed === "done";
  // Transport is irrelevant once access is resolved (telehealth booked / no travel).
  const transportIrrelevant = patient.journey.access_resolved === "done" || patient.telehealthAvailable;
  // "Contact patient" is done once the patient has been reached and confirmed.
  const patientAlreadyConfirmed =
    patient.barrierResolved &&
    patient.category === "ON_TRACK" &&
    (patient.appointmentStatus || "").toLowerCase().includes("confirmed");

  let secondaryActions;
  if (visitComplete) {
    // Post-visit: travel/patient-contact no longer apply.
    secondaryActions = [
      { icon: Icon.Phone, label: "Contact specialist office" },
      { icon: Icon.Doc, label: "Update PCP" },
      { icon: Icon.Clock, label: "View referral history" },
    ];
  } else {
    secondaryActions = [
      { icon: Icon.Phone, label: "Contact patient" },
      { icon: Icon.Car, label: "Arrange transport" },
      { icon: Icon.Doc, label: "Update PCP" },
    ];
    if (transportIrrelevant) secondaryActions = secondaryActions.filter((a) => a.label !== "Arrange transport");
    if (patientAlreadyConfirmed) secondaryActions = secondaryActions.filter((a) => a.label !== "Contact patient");
  }

  return (
    <div className="animate-fade-in space-y-5">
      <button type="button" onClick={onBack} className="btn btn-ghost btn-sm -ml-3">
        <Icon.Chevron className="h-4 w-4 rotate-180" />
        Back to dashboard
      </button>

      {/* Header: who, risk, status, key facts */}
      <header className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={patient.name} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">{patient.name}</h1>
              <RiskBadge level={patient.risk} />
              <WorkflowPill status={patient.workflowStatus} tone={WORKFLOW_TONE[patient.workflowStatus]} />
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              {patient.specialty} referral · placed {patient.referralDate} · PCP {patient.pcp}
            </p>
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-slate-600">Stalled</dt>
            <dd className="font-semibold text-slate-900">
              {patient.stalledDays > 0 ? `${patient.stalledDays} days` : "Not stalled"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600">Distance</dt>
            <dd className="font-semibold text-slate-900">
              {patient.distanceMiles === 0 ? "Telehealth" : `${patient.distanceMiles} miles`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600">Insurance</dt>
            <dd className="font-semibold text-slate-900">{patient.insurance}</dd>
          </div>
        </dl>
      </header>

      <StatusBanner patient={patient} resolved={resolved} />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Action column comes first in the DOM (and on mobile); it sits on the right on desktop */}
        <div className="space-y-4 lg:order-2 lg:col-span-1">
          <ActionCenter patient={patient} onRequestAction={onRequestAction} onExternalEvent={onExternalEvent} />

          <RiskExplainer patient={patient} />

          <section aria-labelledby="other-actions-heading" className="card p-5">
            <h2 id="other-actions-heading" className="text-sm font-semibold text-slate-900">
              Other coordinator actions
            </h2>
            <p className="mb-3 mt-1 text-xs text-slate-600">
              Simulated. These do not change referral state in the prototype.
            </p>
            <div className="flex flex-wrap gap-2">
              {secondaryActions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSimulateToast(`${a.label} — simulated for ${patient.name}.`)}
                >
                  <a.icon className="h-4 w-4" />
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() =>
              onAskAI(
                resolved
                  ? `What should I do next for ${patient.name.split(" ")[0]}?`
                  : `What is blocking ${patient.name.split(" ")[0]}'s referral?`
              )
            }
            className="flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left transition-colors hover:bg-brand-100"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Icon.Spark className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand-900">Ask the AI Coordinator</span>
              <span className="block text-xs text-brand-800">
                {resolved ? "What's the next step for this referral?" : "Why is this referral at risk and what should I do?"}
              </span>
            </span>
          </button>
        </div>

        {/* Evidence column: journey timeline, then connected signals */}
        <div className="space-y-5 lg:order-1 lg:col-span-2">
          <section aria-labelledby="journey-heading" className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 id="journey-heading" className="text-base font-semibold text-slate-900">
                Referral journey
              </h2>
              <span className="text-sm font-medium text-slate-700">
                {completed} of {JOURNEY_STEPS.length} complete
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Referral journey progress"
              aria-valuemin={0}
              aria-valuemax={JOURNEY_STEPS.length}
              aria-valuenow={completed}
              aria-valuetext={`${completed} of ${JOURNEY_STEPS.length} steps complete`}
              className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200"
            >
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <ol aria-label="Referral journey steps">
              {orderedSteps.map((step, i) => {
                const state = patient.journey[step.key] || "pending";
                const styles = STEP_STYLES[state];
                const isLast = i === orderedSteps.length - 1;
                return (
                  <li
                    key={step.key}
                    aria-current={i === currentIndex ? "step" : undefined}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {!isLast && (
                      <span aria-hidden="true" className={`absolute left-[15px] top-8 h-full w-0.5 ${styles.line}`} />
                    )}
                    <span
                      className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${styles.ring}`}
                    >
                      <StepIcon state={state} />
                    </span>
                    <div className="pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{step.label}</span>
                        <StatusPill tone={styles.pill}>{styles.pillText}</StatusPill>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{patient.timelineNotes[step.key]}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <ConnectedSignals patient={patient} />
        </div>
      </div>
    </div>
  );
}
