import { useState } from "react";
import { RiskBadge, StatusPill, WorkflowPill, InfoTooltip, Avatar, Icon } from "./ui.jsx";
import { ACTION_LABELS, WORKFLOW_TONE } from "../data/patients.js";

const RISK_ORDER = { High: 0, Medium: 1, Low: 2 };

// Dashboard category buckets, in display order.
// EVERYTHING and URGENT are used by the summary cards; the rest also drive the chips.
const BUCKETS = [
  { key: "EVERYTHING", label: "All referrals", match: (p) => p.workflowStatus !== "Closed" },
  { key: "ALL", label: "Needs attention now", match: (p) => p.risk !== "Low" },
  { key: "URGENT", label: "Urgent", match: (p) => p.risk === "High" },
  { key: "INSURANCE", label: "Blocked by insurance", match: (p) => p.category === "INSURANCE" },
  { key: "ACCESS", label: "Blocked by access", match: (p) => p.category === "ACCESS" },
  { key: "PATIENT", label: "Waiting on patient", match: (p) => p.category === "PATIENT" },
  { key: "SPECIALIST", label: "Waiting on specialist", match: (p) => p.category === "SPECIALIST" },
  { key: "CLOSED_LOOP", label: "Closed-loop gap · missing specialist note", match: (p) => p.category === "CLOSED_LOOP" },
  { key: "ON_TRACK", label: "On track", match: (p) => p.workflowStatus === "On track" },
];

function StatCard({ label, value, tone, sub, onClick, selected }) {
  const tones = {
    red: "from-red-500 to-red-600",
    amber: "from-amber-500 to-amber-600",
    green: "from-emerald-500 to-emerald-600",
    blue: "from-brand-500 to-brand-600",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left shadow-card transition active:scale-[0.99] ${
        selected
          ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${selected ? "text-brand-700" : "text-slate-500"}`}>{label}</span>
        <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${tones[tone]}`} />
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </button>
  );
}

function appointmentTone(status) {
  const s = status.toLowerCase();
  if (s.includes("not")) return "red";
  if (s.includes("hold") || s.includes("pending") || s.includes("unconfirmed") || s.includes("wait")) return "amber";
  return "green";
}

export default function Dashboard({ patients, onSelectPatient }) {
  const [filter, setFilter] = useState("ALL");

  const sorted = [...patients].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
  const activeBucket = BUCKETS.find((b) => b.key === filter) || BUCKETS[0];
  const visible = sorted.filter(activeBucket.match);

  const high = patients.filter((p) => p.risk === "High").length;
  const atRisk = patients.filter((p) => p.risk !== "Low").length;
  // Active = everything except Closed referrals. On track = workflow status On track
  // (a Low-risk but Closed referral like Emily is NOT counted as On track).
  const activeReferrals = patients.filter((p) => p.workflowStatus !== "Closed").length;
  const onTrack = patients.filter((p) => p.workflowStatus === "On track").length;

  // Demo impact metrics, derived live from the mock data (not real outcomes).
  // These are deliberately DIFFERENT things:
  //  - actionsTaken: any approved action CareBridge initiated
  //  - barriersResolved: the underlying problem is actually gone (includes closed loops)
  //  - returnedOnTrack: resolved AND the patient returned to an active on-track referral
  //    (a referral that completed and closed, like Emily, is NOT "returned on track")
  //  - loopsClosed: the referral loop fully closed
  const actionsTaken = patients.filter((p) => p.actionTaken).length;
  const barriersResolved = patients.filter((p) => p.barrierResolved).length;
  const returnedOnTrack = patients.filter((p) => p.movedOnTrack && p.risk === "Low" && !p.loopClosed).length;
  const loopsClosed = patients.filter((p) => p.loopClosed).length;
  const stalledList = patients.filter((p) => p.stalledDays > 0).map((p) => p.stalledDays);
  const avgStalled = stalledList.length
    ? (stalledList.reduce((a, b) => a + b, 0) / stalledList.length).toFixed(1)
    : "0";

  return (
    <div className="animate-fade-in space-y-6">
      {/* Why CareBridge? — product positioning (no workflow logic) */}
      <WhyCareBridge />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">These are the referrals that need human attention</h1>
        <p className="mt-1 text-sm text-slate-500">
          CareBridge monitors each referral across disconnected systems and surfaces only the ones that have
          stalled or broken — highest risk first.
        </p>
      </div>

      {/* Summary stats — click to filter the table below */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active referrals"
          value={activeReferrals}
          tone="blue"
          sub="Being monitored"
          selected={filter === "EVERYTHING"}
          onClick={() => setFilter("EVERYTHING")}
        />
        <StatCard
          label="Needs attention"
          value={atRisk}
          tone="red"
          sub="Require coordinator action"
          selected={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
        <StatCard
          label="Urgent"
          value={high}
          tone="amber"
          sub="Highest priority"
          selected={filter === "URGENT"}
          onClick={() => setFilter("URGENT")}
        />
        <StatCard
          label="On track"
          value={onTrack}
          tone="green"
          sub="No action needed"
          selected={filter === "ON_TRACK"}
          onClick={() => setFilter("ON_TRACK")}
        />
      </div>

      {/* Demo impact — fictional metrics derived from the mock data */}
      <div className="rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50 to-emerald-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon.Spark className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-semibold text-slate-800">Coordination impact</span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Demo metrics based on fictional data
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <Metric value={patients.length} label="Active referrals" />
          <Metric value={atRisk} label="At-risk referrals" tone="text-red-600" />
          <Metric value={actionsTaken} label="Actions taken" tone="text-brand-600" />
          <Metric value={barriersResolved} label="Barriers resolved" tone="text-emerald-600" />
          <Metric value={returnedOnTrack} label="Returned on track" tone="text-emerald-600" />
          <Metric value={loopsClosed} label="Referral loops closed" tone="text-emerald-600" />
          <Metric
            value={`${avgStalled}d`}
            label="Avg. time stalled"
            info={{
              title: "Average time stalled",
              body: "Average elapsed time since each at-risk referral stopped progressing at its expected next workflow step.",
              note: "Demo metric based on fictional data.",
            }}
          />
        </div>
      </div>

      {/* Operational category filter */}
      <div className="flex flex-wrap gap-2">
        {BUCKETS.map((b) => {
          const count = sorted.filter(b.match).length;
          const active = b.key === filter;
          return (
            <button
              key={b.key}
              onClick={() => setFilter(b.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-brand-500 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {b.label}
              <span className={`rounded-full px-1.5 ${active ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table — desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Patient</th>
              <th className="px-5 py-3 font-semibold">Risk</th>
              <th className="px-5 py-3 font-semibold">Workflow status</th>
              <th className="px-5 py-3 font-semibold">Main barrier</th>
              <th className="px-5 py-3 font-semibold">Primary signal</th>
              <th className="px-5 py-3 font-semibold">Stalled</th>
              <th className="px-5 py-3 font-semibold">Recommended action</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                  No referrals in this category right now.
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr key={p.id} onClick={() => onSelectPatient(p.id)} className="group cursor-pointer transition hover:bg-brand-50/50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.specialty} · {p.insurance}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4"><RiskBadge level={p.risk} /></td>
                <td className="px-5 py-4">
                  <WorkflowPill status={p.workflowStatus} tone={WORKFLOW_TONE[p.workflowStatus]} />
                </td>
                <td className="px-5 py-4 text-slate-600">{p.barrier}</td>
                <td className="px-5 py-4">
                  <StatusPill tone="slate">{p.blockingSystem || "—"}</StatusPill>
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {p.stalledDays > 0 ? `${p.stalledDays} days` : "—"}
                </td>
                <td className="px-5 py-4">
                  {p.recommendedAction === "none" ? (
                    <span className="text-xs font-medium text-emerald-600">No intervention needed</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition group-hover:border-brand-300 group-hover:bg-brand-100">
                      {ACTION_LABELS[p.recommendedAction]}
                      <Icon.Chevron className="h-3 w-3" />
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Icon.Chevron className="ml-auto h-4 w-4 text-slate-300" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="grid gap-4 md:hidden">
        {visible.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            No referrals in this category right now.
          </div>
        )}
        {visible.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPatient(p.id)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} />
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.specialty} · {p.referralDate}</div>
                </div>
              </div>
              <RiskBadge level={p.risk} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <WorkflowPill status={p.workflowStatus} tone={WORKFLOW_TONE[p.workflowStatus]} />
              <StatusPill tone="slate">{p.barrier}</StatusPill>
              {p.blockingSystem && <StatusPill tone="slate">Primary signal: {p.blockingSystem}</StatusPill>}
            </div>
            {p.recommendedAction !== "none" && (
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {ACTION_LABELS[p.recommendedAction]}
                  <Icon.Chevron className="h-3 w-3" />
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Compact, judge-friendly value proposition. Pure presentation — reads no patient
// state and changes nothing.
function WhyCareBridge() {
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
    {
      title: "Less manual reconciliation",
      body: "Fewer systems for coordinators to check individually.",
    },
    {
      title: "Faster exception resolution",
      body: "Blocked referrals are surfaced with the reason and recommended next action.",
    },
    {
      title: "Better closed-loop completion",
      body: "CareBridge keeps monitoring after scheduling and specialist visits so missing handoffs are not mistaken for completed referrals.",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Icon.Spark className="h-4 w-4 text-brand-600" />
        <h2 className="text-base font-semibold text-slate-900">Why CareBridge?</h2>
      </div>
      <p className="mb-3 mt-0.5 text-sm text-slate-500">
        Existing systems each know one part of the referral journey. CareBridge watches the gaps between them.
      </p>

      {/* Side-by-side comparison */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Without CareBridge</div>
          <ul className="space-y-1">
            {without.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">With CareBridge</div>
          <ul className="space-y-1">
            {withCB.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-emerald-800">
                <Icon.Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Three value outcomes */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {outcomes.map((o) => (
          <div key={o.title} className="rounded-lg border border-slate-200 p-3">
            <div className="text-sm font-semibold text-slate-900">{o.title}</div>
            <p className="mt-0.5 text-xs text-slate-500">{o.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        Reduces the manual work of finding and resolving referral failures across disconnected systems. Product
        value proposition for this prototype — not a validated performance claim.
      </p>
    </section>
  );
}

function Metric({ value, label, tone, info }) {
  return (
    <div>
      <div className={`text-2xl font-bold ${tone || "text-slate-900"}`}>{value}</div>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        {label}
        {info && <InfoTooltip title={info.title} body={info.body} note={info.note} label={`About ${label}`} />}
      </div>
    </div>
  );
}
