import { useState } from "react";
import { RiskBadge, WorkflowPill, InfoTooltip, Avatar, Icon } from "./ui.jsx";
import { WORKFLOW_TONE } from "../data/patients.js";
import { computeMetrics } from "../lib/metrics.js";
import { RISK_ORDER } from "../lib/filters.js";
import { NextAction, BarrierDetail } from "./referral-bits.jsx";
import LiveFhirProof from "./LiveFhirProof.jsx";

// KPI tone language: Active = brand, Needs attention = amber, Urgent = red, On track = green.
const KPI_TONES = {
  brand: { chip: "bg-brand-50 text-brand-700", bar: "bg-brand-500" },
  amber: { chip: "bg-amber-50 text-amber-800", bar: "bg-amber-500" },
  red: { chip: "bg-red-50 text-red-700", bar: "bg-red-600" },
  green: { chip: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-600" },
};

function KpiCard({ label, value, sub, tone, icon: IconComp, onClick }) {
  const t = KPI_TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-card transition-all hover:border-slate-300 hover:shadow-cardhover motion-safe:hover:-translate-y-0.5"
    >
      <span className="flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.chip}`}>
          <IconComp className="h-5 w-5" />
        </span>
        <Icon.ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:text-brand-700 motion-safe:group-hover:translate-x-0.5" />
      </span>
      <span className="mt-4 font-display text-4xl font-bold leading-none tabular-nums tracking-tight text-navy-900">{value}</span>
      <span className="mt-2 text-sm font-semibold text-slate-900">{label}</span>
      <span className="text-xs text-slate-600">{sub}</span>
      <span className="sr-only">. View in referrals.</span>
      <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-1 ${t.bar}`} />
    </button>
  );
}

function OutcomeRow({ icon: IconComp, label, hint, value, info }) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
        <IconComp className="h-4 w-4" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          {label}
          {info && <InfoTooltip title={info.title} body={info.body} note={info.note} label={`About ${label}`} />}
        </div>
        <div className="mt-0.5 text-xs text-slate-600">{hint}</div>
      </div>
      <span className="min-w-[2.75rem] text-right font-display text-xl font-bold tabular-nums text-navy-900">{value}</span>
    </li>
  );
}

export default function Dashboard({ patients, onSelectPatient, onOpenReferrals }) {
  const m = computeMetrics(patients);

  // Priority queue: everything that still needs attention, highest risk (then longest stalled) first.
  const queue = patients
    .filter((p) => p.risk !== "Low")
    .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || b.stalledDays - a.stalledDays);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="label-caps text-brand-700">Operations overview</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          Referral Command Center
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-600 sm:text-base">
          Monitor referrals, identify barriers, and coordinate the next action.
        </p>
      </div>

      <section aria-label="Referral summary" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active referrals"
          value={m.activeReferrals}
          sub="Being monitored across systems"
          tone="brand"
          icon={Icon.Doc}
          onClick={() => onOpenReferrals("EVERYTHING")}
        />
        <KpiCard
          label="Needs attention"
          value={m.atRisk}
          sub="Require coordinator action"
          tone="amber"
          icon={Icon.Clock}
          onClick={() => onOpenReferrals("ALL")}
        />
        <KpiCard
          label="Urgent"
          value={m.high}
          sub="Highest priority, High risk"
          tone="red"
          icon={Icon.Alert}
          onClick={() => onOpenReferrals("URGENT")}
        />
        <KpiCard
          label="On track"
          value={m.onTrack}
          sub="No action needed"
          tone="green"
          icon={Icon.Check}
          onClick={() => onOpenReferrals("ON_TRACK")}
        />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Priority queue */}
        <section aria-labelledby="priority-heading" className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3.5">
            <div>
              <h2 id="priority-heading" className="font-display text-lg font-bold text-navy-900">
                Priority queue
              </h2>
              <p className="text-sm text-slate-600">
                {queue.length === 0
                  ? "Nothing needs attention right now."
                  : `${queue.length} ${queue.length === 1 ? "referral needs" : "referrals need"} a coordinator, highest risk first.`}
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenReferrals("ALL")}>
              View all referrals
              <Icon.ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Icon.Check className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-slate-900">All clear</p>
              <p className="text-sm text-slate-600">Every active referral is on track or closed.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {queue.map((p) => (
                <li
                  key={p.id}
                  className="relative py-3 pl-6 pr-5 transition-colors focus-within:bg-brand-50/50 hover:bg-slate-50"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-1.5 ${p.risk === "High" ? "bg-red-600" : "bg-amber-500"}`}
                  />
                  {/* Row layout by width: 2 lines (md), 3 aligned columns (800px+), 2 lines while the
                      outcomes panel is beside the queue (1280-1399px), 4 aligned columns (1536px+). */}
                  <div className="grid gap-x-4 gap-y-1.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center min-[800px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_16.5rem] xl:max-[1399px]:grid-cols-[minmax(0,1fr)_auto] min-[1536px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13.5rem_18rem]">
                    <div className="flex items-center gap-3 md:col-start-1 md:row-start-1 min-[800px]:row-span-2 xl:max-[1399px]:row-span-1 min-[1536px]:row-span-1">
                      <Avatar name={p.name} />
                      <div className="min-w-0">
                        {/* Stretched button: the whole row is one real, keyboard-focusable control */}
                        <button
                          type="button"
                          onClick={() => onSelectPatient(p.id)}
                          className="rounded text-left font-semibold leading-tight text-navy-900 after:absolute after:inset-0 after:content-['']"
                        >
                          {p.name}
                          <span className="sr-only">, open referral details</span>
                        </button>
                        <div className="text-xs leading-snug text-slate-600">
                          {p.specialty} · referred {p.referralDate}
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 leading-snug md:col-start-1 md:row-start-2 min-[800px]:col-start-2 min-[800px]:row-span-2 min-[800px]:row-start-1 xl:max-[1399px]:col-start-1 xl:max-[1399px]:row-span-1 xl:max-[1399px]:row-start-2 min-[1536px]:col-start-2 min-[1536px]:row-span-1 min-[1536px]:row-start-1">
                      <BarrierDetail p={p} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 md:col-start-2 md:row-start-1 md:justify-self-end min-[800px]:col-start-3 xl:max-[1399px]:col-start-2 min-[1536px]:col-start-3 min-[1536px]:justify-self-start">
                      <RiskBadge level={p.risk} />
                      <WorkflowPill status={p.workflowStatus} tone={WORKFLOW_TONE[p.workflowStatus]} />
                    </div>
                    <div className="md:col-start-2 md:row-start-2 md:justify-self-end min-[800px]:col-start-3 xl:max-[1399px]:col-start-2 min-[1536px]:col-start-4 min-[1536px]:row-start-1">
                      <NextAction p={p} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Operational outcomes */}
        <section aria-labelledby="impact-heading" className="card h-fit px-5 py-4">
          <h2 id="impact-heading" className="font-display text-base font-bold text-navy-900">
            Operational outcomes
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">What CareBridge has resolved so far.</p>
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Demo metrics based on fictional data
          </span>
          <ul className="mt-1 divide-y divide-slate-100">
            <OutcomeRow icon={Icon.Send} label="Actions taken" hint="Approved by a coordinator" value={m.actionsTaken} />
            <OutcomeRow icon={Icon.Shield} label="Barriers resolved" hint="Underlying problem cleared" value={m.barriersResolved} />
            <OutcomeRow icon={Icon.Activity} label="Returned on track" hint="Back to an active, on-track referral" value={m.returnedOnTrack} />
            <OutcomeRow icon={Icon.Doc} label="Referral loops closed" hint="Specialist info back at the PCP" value={m.loopsClosed} />
            <OutcomeRow
              icon={Icon.Clock}
              label="Avg. time stalled"
              hint="Across stalled referrals"
              value={`${m.avgStalled}d`}
              info={{
                title: "Average time stalled",
                body: "Average elapsed time since each at-risk referral stopped progressing at its expected next workflow step.",
                note: "Demo metric based on fictional data.",
              }}
            />
          </ul>
        </section>
      </div>

      <WhyCareBridge />

      {/* Live interoperability proof: isolated, reads a real FHIR sandbox. */}
      <LiveFhirProof />
    </div>
  );
}

// Compact value proposition, visually secondary. Pure presentation: reads no patient state.
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
    <section aria-labelledby="why-heading" className="rounded-2xl border border-slate-200 bg-white/60 px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Icon.Spark className="h-4 w-4 text-brand-700" />
          <h2 id="why-heading" className="text-sm font-semibold text-navy-900">
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
        <div id="why-details" className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="label-caps mb-2">Without CareBridge</h3>
              <ul className="space-y-1.5">
                {without.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-slate-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">With CareBridge</h3>
              <ul className="space-y-1.5">
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
              <div key={o.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <dt className="text-sm font-semibold text-navy-900">{o.title}</dt>
                <dd className="mt-1 text-sm text-slate-700">{o.body}</dd>
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
