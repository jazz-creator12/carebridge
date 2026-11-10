import { useState } from "react";
import { RiskBadge, WorkflowPill, InfoTooltip, Avatar, Icon } from "./ui.jsx";
import { ACTION_LABELS, WORKFLOW_TONE } from "../data/patients.js";
import { computeMetrics } from "../lib/metrics.js";
import LiveFhirProof from "./LiveFhirProof.jsx";

const RISK_ORDER = { High: 0, Medium: 1, Low: 2 };

// Filter buckets. The four summary cards drive EVERYTHING / ALL / URGENT / ON_TRACK;
// the barrier-type chips drive the category buckets. All share one `filter` state.
const BUCKETS = [
  { key: "EVERYTHING", label: "Active referrals", match: (p) => p.workflowStatus !== "Closed" },
  { key: "ALL", label: "Needs attention now", match: (p) => p.risk !== "Low" },
  { key: "URGENT", label: "Urgent", match: (p) => p.risk === "High" },
  { key: "INSURANCE", label: "Blocked by insurance", match: (p) => p.category === "INSURANCE" },
  { key: "ACCESS", label: "Blocked by access", match: (p) => p.category === "ACCESS" },
  { key: "PATIENT", label: "Waiting on patient", match: (p) => p.category === "PATIENT" },
  { key: "SPECIALIST", label: "Waiting on specialist", match: (p) => p.category === "SPECIALIST" },
  { key: "CLOSED_LOOP", label: "Closed-loop gap · missing specialist note", match: (p) => p.category === "CLOSED_LOOP" },
  { key: "ON_TRACK", label: "On track", match: (p) => p.workflowStatus === "On track" },
];

const CHIP_KEYS = ["INSURANCE", "ACCESS", "PATIENT", "SPECIALIST", "CLOSED_LOOP"];
const CHIP_BUCKETS = BUCKETS.filter((b) => CHIP_KEYS.includes(b.key));

// Color language: Urgent = red, Needs attention = amber, On track = green, Active = brand blue.
const CARD_TONES = {
  blue: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  green: "bg-emerald-50 text-emerald-700",
};

function SummaryCard({ label, value, sub, tone, icon: IconComp, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-[112px] flex-col rounded-xl border p-4 text-left shadow-card transition-colors ${
        selected
          ? "border-brand-600 bg-brand-50/60 ring-1 ring-brand-600"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${CARD_TONES[tone]}`}>
          <IconComp className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {selected && <Icon.Check className="ml-auto h-4 w-4 text-brand-700" />}
      </span>
      <span className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</span>
      <span className="mt-0.5 text-xs text-slate-600">{sub}</span>
    </button>
  );
}

// What the coordinator should do next, shown with an icon + text (never color alone).
function NextAction({ p }) {
  if (p.recommendedAction === "none") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800">
        <Icon.Check className="h-4 w-4 flex-shrink-0" />
        No intervention needed
      </span>
    );
  }
  if (p.recommendedAction === "monitor_payer") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900">
        <Icon.Clock className="h-4 w-4 flex-shrink-0" />
        {ACTION_LABELS[p.recommendedAction]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800">
      {ACTION_LABELS[p.recommendedAction]}
      <Icon.ArrowRight className="h-4 w-4 flex-shrink-0" />
    </span>
  );
}

function BarrierDetail({ p }) {
  const meta = [p.blockingSystem && `Primary signal: ${p.blockingSystem}`, p.stalledDays > 0 && `Stalled ${p.stalledDays} days`]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <div className="font-medium text-slate-900">{p.barrier}</div>
      {meta && <div className="mt-0.5 text-xs text-slate-600">{meta}</div>}
    </>
  );
}

function Metric({ value, label, hint, info }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
        {label}
        {info && <InfoTooltip title={info.title} body={info.body} note={info.note} label={`About ${label}`} />}
      </div>
      <div className="text-xs text-slate-600">{hint}</div>
    </div>
  );
}

export default function Dashboard({ patients, onSelectPatient }) {
  const [filter, setFilter] = useState("ALL");

  const sorted = [...patients].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
  const activeBucket = BUCKETS.find((b) => b.key === filter) || BUCKETS[1];
  const visible = sorted.filter(activeBucket.match);

  const { high, atRisk, activeReferrals, onTrack, actionsTaken, barriersResolved, returnedOnTrack, loopsClosed, avgStalled } =
    computeMetrics(patients);

  const emptyState = (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <Icon.Check className="h-6 w-6 text-slate-500" />
      <p className="text-sm font-medium text-slate-800">No referrals in this view right now.</p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilter("ALL")}>
        Show referrals needing attention
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          These are the referrals that need human attention
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          CareBridge monitors each referral across disconnected systems and surfaces only the ones that have
          stalled or broken, highest risk first.
        </p>
      </div>

      <WhyCareBridge />

      {/* Summary cards: click to filter the queue below */}
      <section aria-label="Referral summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Active referrals"
          value={activeReferrals}
          sub="Being monitored"
          tone="blue"
          icon={Icon.Doc}
          selected={filter === "EVERYTHING"}
          onClick={() => setFilter("EVERYTHING")}
        />
        <SummaryCard
          label="Needs attention"
          value={atRisk}
          sub="Require coordinator action"
          tone="amber"
          icon={Icon.Clock}
          selected={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
        <SummaryCard
          label="Urgent"
          value={high}
          sub="Highest priority"
          tone="red"
          icon={Icon.Alert}
          selected={filter === "URGENT"}
          onClick={() => setFilter("URGENT")}
        />
        <SummaryCard
          label="On track"
          value={onTrack}
          sub="No action needed"
          tone="green"
          icon={Icon.Check}
          selected={filter === "ON_TRACK"}
          onClick={() => setFilter("ON_TRACK")}
        />
      </section>

      {/* Referral queue */}
      <section aria-labelledby="queue-heading" className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="queue-heading" className="text-base font-semibold text-slate-900">
                Referral queue
              </h2>
              <p aria-live="polite" className="text-sm text-slate-600">
                Showing {visible.length} {visible.length === 1 ? "referral" : "referrals"} · {activeBucket.label}
              </p>
            </div>
            {filter !== "ALL" && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilter("ALL")}>
                Reset filter
              </button>
            )}
          </div>
          <div role="group" aria-label="Filter by barrier type" className="flex flex-wrap items-center gap-2">
            <span className="label-caps mr-1">Barrier type</span>
            {CHIP_BUCKETS.map((b) => {
              const count = sorted.filter(b.match).length;
              const active = b.key === filter;
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(active ? "ALL" : b.key)}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {b.label}
                  <span
                    className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table: tablet and up */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <caption className="sr-only">
              Referrals, sorted with the highest risk first. Open a patient name to see the full referral record.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="label-caps px-5 py-3">Patient</th>
                <th scope="col" className="label-caps px-3 py-3">Risk &amp; status</th>
                <th scope="col" className="label-caps px-3 py-3">Barrier</th>
                <th scope="col" className="label-caps px-5 py-3">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4}>{emptyState}</td>
                </tr>
              )}
              {visible.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  className="cursor-pointer align-top transition-colors hover:bg-slate-50 focus-within:bg-brand-50/60"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} />
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(p.id);
                          }}
                          className="rounded text-left font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                        >
                          {p.name}
                          <span className="sr-only">, open referral details</span>
                        </button>
                        <div className="text-xs text-slate-600">
                          {p.specialty} · referred {p.referralDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <RiskBadge level={p.risk} />
                      <WorkflowPill status={p.workflowStatus} tone={WORKFLOW_TONE[p.workflowStatus]} />
                    </div>
                  </td>
                  <td className="max-w-[18rem] px-3 py-4">
                    <BarrierDetail p={p} />
                  </td>
                  <td className="px-5 py-4">
                    <NextAction p={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards: mobile */}
        <ul className="divide-y divide-slate-100 md:hidden">
          {visible.length === 0 && <li>{emptyState}</li>}
          {visible.map((p) => (
            <li key={p.id} className="relative p-4 transition-colors focus-within:bg-brand-50/60 active:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} />
                  <div>
                    {/* Stretched button: the whole card is one real, keyboard-focusable control */}
                    <button
                      type="button"
                      onClick={() => onSelectPatient(p.id)}
                      className="rounded text-left font-semibold text-slate-900 after:absolute after:inset-0 after:content-['']"
                    >
                      {p.name}
                      <span className="sr-only">, open referral details</span>
                    </button>
                    <div className="text-xs text-slate-600">
                      {p.specialty} · referred {p.referralDate}
                    </div>
                  </div>
                </div>
                <RiskBadge level={p.risk} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <WorkflowPill status={p.workflowStatus} tone={WORKFLOW_TONE[p.workflowStatus]} />
              </div>
              <div className="mt-2 text-sm">
                <BarrierDetail p={p} />
              </div>
              <div className="mt-3">
                <NextAction p={p} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* What CareBridge has resolved: demo metrics */}
      <section aria-labelledby="impact-heading" className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 id="impact-heading" className="text-base font-semibold text-slate-900">
            What CareBridge has resolved
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Demo metrics based on fictional data
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <Metric value={actionsTaken} label="Actions taken" hint="Approved by a coordinator" />
          <Metric value={barriersResolved} label="Barriers resolved" hint="Underlying problem cleared" />
          <Metric value={returnedOnTrack} label="Returned on track" hint="Back to an active, on-track referral" />
          <Metric value={loopsClosed} label="Referral loops closed" hint="Specialist info back at the PCP" />
          <Metric
            value={`${avgStalled}d`}
            label="Avg. time stalled"
            hint="Across stalled referrals"
            info={{
              title: "Average time stalled",
              body: "Average elapsed time since each at-risk referral stopped progressing at its expected next workflow step.",
              note: "Demo metric based on fictional data.",
            }}
          />
        </div>
      </section>

      {/* Live interoperability proof: isolated, reads a real FHIR sandbox. */}
      <LiveFhirProof />
    </div>
  );
}

// Compact value proposition. Pure presentation: reads no patient state, changes nothing.
function WhyCareBridge() {
  const [open, setOpen] = useState(false);
  const without = [
    "Coordinator checks multiple disconnected systems manually",
    "Problems discovered reactively; risk info is fragmented",
    "Follow-up depends on staff remembering to check",
    "Specialist handoff may remain incomplete",
  ];
  const withCB = [
    "Cross-system signals monitored in one place",
    "Exceptions surfaced automatically, highest-priority first",
    "Recommended next action prepared; human approves it",
    "Keeps monitoring until the referral progresses or closes",
  ];
  const outcomes = [
    { title: "Less manual reconciliation", body: "Fewer systems for coordinators to check individually." },
    { title: "Faster exception resolution", body: "Blocked referrals are surfaced with the reason and recommended next action." },
    {
      title: "Better closed-loop completion",
      body: "CareBridge keeps monitoring after scheduling and specialist visits so missing handoffs are not mistaken for completed referrals.",
    },
  ];

  return (
    <section aria-labelledby="why-heading" className="card px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Icon.Spark className="h-4 w-4 text-brand-700" />
          <h2 id="why-heading" className="text-sm font-semibold text-slate-900">
            Why CareBridge?
          </h2>
        </div>
        <p className="min-w-[16rem] flex-1 text-sm text-slate-700">
          Existing systems each know one part of the referral journey. CareBridge watches the gaps between them.
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="why-details"
          onClick={() => setOpen((v) => !v)}
          className="btn btn-secondary btn-sm"
        >
          {open ? "Hide comparison" : "See comparison"}
          <Icon.Chevron className={`h-4 w-4 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {outcomes.map((o) => (
          <li key={o.title} className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
            <Icon.Check className="h-4 w-4 text-emerald-700" />
            {o.title}
          </li>
        ))}
      </ul>

      {open && (
        <div id="why-details" className="mt-3 space-y-3 border-t border-slate-200 pt-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h3 className="label-caps mb-1.5">Without CareBridge</h3>
              <ul className="space-y-1">
                {without.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-slate-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">With CareBridge</h3>
              <ul className="space-y-1">
                {withCB.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-emerald-900">
                    <Icon.Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            {outcomes.map((o) => (
              <div key={o.title} className="rounded-lg border border-slate-200 p-3">
                <dt className="text-sm font-semibold text-slate-900">{o.title}</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{o.body}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-slate-600">
            Reduces the manual work of finding and resolving referral failures across disconnected systems. Product
            value proposition for this prototype, not a validated performance claim.
          </p>
        </div>
      )}
    </section>
  );
}
