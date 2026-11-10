import { useId, useState } from "react";
import { JOURNEY_STEPS, ACTION_LABELS, WORKFLOW_TONE, FHIR_ARCHITECTURE } from "../data/patients.js";
import { orderJourneySteps } from "../lib/journey.js";
import {
  RiskBadge,
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
  done: { ring: "bg-emerald-600 text-white", line: "bg-emerald-600", tag: "bg-emerald-50 text-emerald-800", text: "Completed" },
  blocked: { ring: "bg-red-600 text-white", line: "bg-slate-200", tag: "bg-red-50 text-red-800", text: "Blocked" },
  pending: { ring: "border-2 border-slate-300 bg-white text-slate-600", line: "bg-slate-200", tag: "bg-slate-100 text-slate-700", text: "Pending" },
};

function StepIcon({ state }) {
  if (state === "done") return <Icon.Check className="h-4 w-4" />;
  if (state === "blocked") return <Icon.Block className="h-4 w-4" />;
  return <Icon.Clock className="h-4 w-4" />;
}

// One short sentence: what the coordinator does next, from existing state (display only).
function nextActionText(patient) {
  if (patient.loopClosed) return "No further action required. Referral closed.";
  if (patient.barrierResolved) {
    const o = patient.nextStepOverride;
    if (o) return o.replace(/^Next step:\s*/i, "").replace(/^./, (c) => c.toUpperCase());
    return "Confirm the patient completes the visit, then return specialist information to the PCP.";
  }
  if (patient.actionTaken) {
    if (patient.recommendedAction === "monitor_payer") return "Monitor the payer response. Nothing to re-send.";
    if (patient.awaitingExternal === "specialist_note") return "Waiting on the Specialist EHR to return the visit summary.";
    return "Monitor the response from the external system.";
  }
  return ACTION_LABELS[patient.recommendedAction] || "Review the referral.";
}

function Tile({ icon: IconComp, label, accent, children }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white"}`}>
      <dt className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${accent ? "text-brand-800" : "text-slate-600"}`}>
        <IconComp className="h-4 w-4" />
        {label}
      </dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}

// ---- Connected Signals: integration cards ----
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
      <li className={`rounded-xl border border-l-4 border-slate-200 bg-white p-3.5 ${barByState(sig)}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700">
            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
              <IconComp className="h-4 w-4" />
            </span>
            <span className="truncate">
              <span className="sr-only">Source: </span>
              {sig.source}
            </span>
          </span>
          <SignalStateBadge state={sig.state || "active"} />
        </div>
        <p className="mt-2.5 text-sm font-medium leading-snug text-slate-900">{sig.text}</p>
        {sig.fhir && (
          <div className="mt-2.5">
            <FhirBadge resource={sig.fhir} />
          </div>
        )}
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
    <section aria-labelledby="signals-heading" className="card p-5 sm:p-6 lg:col-span-2 lg:col-start-1">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 id="signals-heading" className="font-display text-lg font-bold text-navy-900">
          Connected signals
        </h2>
        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800 ring-1 ring-inset ring-teal-200">
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
        Information that normally lives in separate systems, combined as a timeline: active problems, items resolved,
        and historical context. Clinical signals align to standard FHIR resources; operational signals keep their own source.
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
    <div id={id} className="mb-5 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal-800">How CareBridge connects systems</h3>
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

// ---- Why this risk level? Always visible, compact, rule-based ----
function RiskCard({ patient }) {
  const isLow = patient.risk === "Low";
  return (
    <section aria-labelledby="risk-heading" className="card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="risk-heading" className="text-sm font-bold text-navy-900">
          Why {patient.risk} risk?
        </h2>
        <RiskBadge level={patient.risk} />
      </div>
      <ul className="mt-3 space-y-2">
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
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        Transparent operational rules, not a clinical prediction.
      </p>
    </section>
  );
}

// ---- Referral Action Center ----
function ActionCenter({ patient, onRequestAction, onExternalEvent }) {
  const resolved = patient.barrierResolved === true;
  const actionTaken = patient.actionTaken === true;
  const ac = patient.actionCenter;
  const shell = "card overflow-hidden lg:col-span-2 lg:col-start-1";

  // Fully resolved barrier (Sarah / David / Robert / Emily after loop closes).
  if (resolved) {
    return (
      <section aria-labelledby="action-heading" className={`${shell} border-emerald-300`}>
        <div className="flex items-center gap-2 bg-emerald-700 px-5 py-3 text-white">
          <Icon.Check className="h-5 w-5" />
          <h2 id="action-heading" className="font-display text-base font-bold">
            {patient.loopClosed ? "Referral loop closed" : "Barrier resolved"}
          </h2>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm text-slate-800">{patient.lastAction}</p>
          {!patient.loopClosed && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Next step</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {patient.nextStepOverride ||
                  "Next step: confirm the patient completes the visit, then ensure the specialist information returns to the PCP."}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Action taken but barrier still ACTIVE (Maria after escalation, Emily after note request).
  if (actionTaken) {
    const awaitingNote = patient.awaitingExternal === "specialist_note";
    return (
      <section aria-labelledby="action-heading" className={`${shell} border-brand-300`}>
        <div className="flex items-center gap-2 bg-brand-700 px-5 py-3 text-white">
          <Icon.Clock className="h-5 w-5" />
          <h2 id="action-heading" className="font-display text-base font-bold">
            Action in progress, barrier still active
          </h2>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm text-slate-800">{patient.lastAction}</p>
          <p className="mt-2 text-sm text-slate-700">
            Taking this action did not resolve the underlying problem. The barrier stays active until an external
            system responds.
          </p>

          {awaitingNote && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-400 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-navy-900 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
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
                className="btn btn-secondary mt-3 w-full sm:w-auto"
              >
                <Icon.Doc className="h-4 w-4" />
                Simulate incoming specialist note
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (!ac) {
    return (
      <section aria-labelledby="action-heading" className={shell}>
        <div className="flex items-center gap-2 bg-emerald-700 px-5 py-3 text-white">
          <Icon.Check className="h-5 w-5" />
          <h2 id="action-heading" className="font-display text-base font-bold">
            Referral Action Center
          </h2>
        </div>
        <p className="p-5 text-sm text-slate-800 sm:p-6">No intervention needed. This referral is on track.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="action-heading" className={`${shell} border-brand-300 shadow-pop`}>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-700 px-5 py-3 text-white">
        <div className="flex items-center gap-2">
          <Icon.Spark className="h-5 w-5" />
          <h2 id="action-heading" className="font-display text-base font-bold">
            Referral Action Center
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-navy-900">
          <Icon.Alert className="h-3.5 w-3.5" />
          Human approval required
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="label-caps">Detected problem</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{ac.problem}</dd>
          </div>
          <div>
            <dt className="label-caps">Evidence</dt>
            <dd className="mt-1 text-sm text-slate-800">{ac.evidence}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 p-4 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-brand-800">Recommended action</dt>
            <dd className="mt-1 font-display text-lg font-bold text-brand-900">{ac.action}</dd>
            <dd className="mt-1 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Expected effect: </span>
              {ac.effect}
            </dd>
          </div>
        </dl>

        <button type="button" onClick={() => onRequestAction(patient)} className="btn btn-primary btn-lg mt-5 w-full">
          <Icon.Spark className="h-5 w-5" />
          Review &amp; approve: {ACTION_LABELS[patient.recommendedAction]}
        </button>
        <p className="mt-2 text-center text-xs text-slate-600">
          Nothing changes until you approve. CareBridge only recommends.
        </p>
      </div>
    </section>
  );
}

export default function PatientJourney({
  patient,
  backLabel = "Back to referrals",
  onBack,
  onAskAI,
  onRequestAction,
  onExternalEvent,
  onSimulateToast,
}) {
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
  const transportIrrelevant = patient.journey.access_resolved === "done" || patient.telehealthAvailable;
  const patientAlreadyConfirmed =
    patient.barrierResolved &&
    patient.category === "ON_TRACK" &&
    (patient.appointmentStatus || "").toLowerCase().includes("confirmed");

  let secondaryActions;
  if (visitComplete) {
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

  const stateIcon = resolved ? (
    <Icon.Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
  ) : patient.actionTaken ? (
    <Icon.Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-300" />
  ) : patient.risk !== "Low" ? (
    <Icon.Alert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
  ) : (
    <Icon.Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
  );

  return (
    <div className="animate-fade-in space-y-5">
      <button type="button" onClick={onBack} className="btn btn-ghost btn-sm -ml-3">
        <Icon.Chevron className="h-4 w-4 rotate-180" />
        {backLabel}
      </button>

      {/* Identity hero */}
      <header className="on-dark overflow-hidden rounded-2xl bg-navy-900 p-5 text-white shadow-pop sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={patient.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">{patient.name}</h1>
                <RiskBadge level={patient.risk} />
                <WorkflowPill status={patient.workflowStatus} tone={WORKFLOW_TONE[patient.workflowStatus]} />
              </div>
              <p className="mt-1 text-sm text-navy-200">
                {patient.specialty} referral · placed {patient.referralDate} · PCP {patient.pcp}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm lg:text-right">
            <div>
              <dt className="text-xs text-navy-300">Stalled</dt>
              <dd className="font-semibold">{patient.stalledDays > 0 ? `${patient.stalledDays} days` : "Not stalled"}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-300">Distance</dt>
              <dd className="font-semibold">{patient.distanceMiles === 0 ? "Telehealth" : `${patient.distanceMiles} miles`}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-300">Insurance</dt>
              <dd className="font-semibold">{patient.insurance}</dd>
            </div>
          </dl>
        </div>
        <div role="status" className="mt-5 flex items-start gap-3 border-t border-white/10 pt-4">
          {stateIcon}
          <p className="max-w-4xl text-sm leading-relaxed text-navy-100">{patient.summary}</p>
        </div>
      </header>

      {/* Snapshot: risk, barrier, progress, next action */}
      <dl aria-label="Referral snapshot" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={Icon.Alert} label="Risk">
          <RiskBadge level={patient.risk} />
          <p className="mt-2 text-sm text-slate-700">{patient.riskReasons[0]}</p>
        </Tile>
        <Tile icon={Icon.Block} label="Current barrier">
          <p className="text-sm font-semibold text-slate-900">{resolved ? "Resolved" : patient.barrier}</p>
          <p className="mt-1 text-xs text-slate-600">
            {resolved
              ? patient.barrier
              : patient.blockingSystem
              ? `Primary signal: ${patient.blockingSystem}`
              : "No active blocker"}
          </p>
        </Tile>
        <Tile icon={Icon.Activity} label="Progress">
          <p className="text-sm font-semibold text-slate-900">
            {completed} of {JOURNEY_STEPS.length} steps complete
          </p>
          <div aria-hidden="true" className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
          </div>
        </Tile>
        <Tile icon={Icon.ArrowRight} label="Next action" accent>
          <p className="text-sm font-semibold leading-snug text-brand-900">{nextActionText(patient)}</p>
        </Tile>
      </dl>

      <div className="grid gap-5 lg:grid-cols-3">
        <ActionCenter patient={patient} onRequestAction={onRequestAction} onExternalEvent={onExternalEvent} />

        {/* Supporting column: sits beside the main content on desktop */}
        <div className="space-y-4 lg:col-start-3 lg:row-span-3 lg:row-start-1">
          <RiskCard patient={patient} />

          <section aria-labelledby="other-actions-heading" className="card p-5">
            <h2 id="other-actions-heading" className="text-sm font-bold text-navy-900">
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
            className="flex w-full items-center gap-3 rounded-2xl border border-navy-200 bg-white p-4 text-left shadow-card transition-all hover:border-brand-400 hover:shadow-cardhover"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
              <Icon.Spark className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy-900">Ask the AI Coordinator</span>
              <span className="block text-xs text-slate-600">
                {resolved ? "What's the next step for this referral?" : "Why is this referral at risk and what should I do?"}
              </span>
            </span>
          </button>
        </div>

        {/* Referral journey */}
        <section aria-labelledby="journey-heading" className="card p-5 sm:p-6 lg:col-span-2 lg:col-start-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="journey-heading" className="font-display text-lg font-bold text-navy-900">
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
              const isCurrent = i === currentIndex;
              return (
                <li key={step.key} aria-current={isCurrent ? "step" : undefined} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && <span aria-hidden="true" className={`absolute left-[15px] top-8 h-full w-0.5 ${styles.line}`} />}
                  <span
                    className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${styles.ring} ${
                      isCurrent ? "ring-4 ring-brand-200" : ""
                    }`}
                  >
                    <StepIcon state={state} />
                  </span>
                  <div className="pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{step.label}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${styles.tag}`}>{styles.text}</span>
                      {isCurrent && (
                        <span className="rounded-md bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">Current step</span>
                      )}
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
  );
}
