import { RiskBadge, WorkflowPill, Avatar, Icon } from "./ui.jsx";
import { WORKFLOW_TONE } from "../data/patients.js";
import { BUCKETS, STATUS_TAB_KEYS, CHIP_KEYS, DEFAULT_FILTER, getBucket, filterReferrals } from "../lib/filters.js";
import { NextAction, BarrierDetail } from "./referral-bits.jsx";

// Full referral queue with every filter: four status tabs + barrier-type chips.
export default function Referrals({ patients, filter, onFilter, onSelectPatient }) {
  const active = getBucket(filter);
  const visible = filterReferrals(patients, filter);
  const countFor = (key) => patients.filter(BUCKETS.find((b) => b.key === key).match).length;

  const emptyState = (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Icon.Check className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-slate-900">No referrals in this view right now.</p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onFilter(DEFAULT_FILTER)}>
        Show referrals needing attention
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <p className="label-caps text-brand-700">Referral queue</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Referrals</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
          Every monitored referral with its barrier, workflow status and the next administrative action. Open a
          patient to review the evidence and approve actions.
        </p>
      </div>

      <section aria-labelledby="queue-heading" className="card overflow-hidden">
        <h2 id="queue-heading" className="sr-only">
          Referral list
        </h2>

        {/* Toolbar: status tabs + barrier chips */}
        <div className="space-y-3 border-b border-slate-200 bg-slate-50/60 px-4 py-4 sm:px-5">
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {STATUS_TAB_KEYS.map((key) => {
              const b = BUCKETS.find((x) => x.key === key);
              const on = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onFilter(key)}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    on
                      ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {b.label === "Needs attention now" ? "Needs attention" : b.label}
                  <span
                    className={`rounded-md px-1.5 text-xs font-bold tabular-nums ${
                      on ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {countFor(key)}
                  </span>
                </button>
              );
            })}
          </div>
          <div role="group" aria-label="Filter by barrier type" className="flex flex-wrap items-center gap-2">
            <span className="label-caps mr-1">Barrier type</span>
            {CHIP_KEYS.map((key) => {
              const b = BUCKETS.find((x) => x.key === key);
              const on = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onFilter(on ? DEFAULT_FILTER : key)}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    on
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                  }`}
                >
                  {b.label}
                  <span
                    className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                      on ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {countFor(key)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-sm text-slate-700">
              Showing <strong className="font-semibold text-navy-900">{visible.length}</strong>{" "}
              {visible.length === 1 ? "referral" : "referrals"} · {active.label}
            </p>
            {filter !== DEFAULT_FILTER && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onFilter(DEFAULT_FILTER)}>
                Reset filter
              </button>
            )}
          </div>
        </div>

        {/* Table: tablet and up */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">
              Referrals, sorted with the highest risk first. Open a patient name to see the full referral record.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th scope="col" className="label-caps px-5 py-3">Patient</th>
                <th scope="col" className="label-caps px-3 py-3">Risk</th>
                <th scope="col" className="label-caps px-3 py-3">Status</th>
                <th scope="col" className="label-caps px-3 py-3">Barrier</th>
                <th scope="col" className="label-caps px-5 py-3">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5}>{emptyState}</td>
                </tr>
              )}
              {visible.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  className="cursor-pointer align-top transition-colors hover:bg-slate-50 focus-within:bg-brand-50/50"
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
                          className="rounded text-left font-semibold text-navy-900 hover:text-brand-700 hover:underline"
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
                    <RiskBadge level={p.risk} />
                  </td>
                  <td className="px-3 py-4">
                    <WorkflowPill status={p.workflowStatus} tone={WORKFLOW_TONE[p.workflowStatus]} />
                  </td>
                  <td className="max-w-[16rem] px-3 py-4">
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
            <li key={p.id} className="relative p-4 transition-colors focus-within:bg-brand-50/50 active:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} />
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectPatient(p.id)}
                      className="rounded text-left font-semibold text-navy-900 after:absolute after:inset-0 after:content-['']"
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
              <div className="mt-3">
                <WorkflowPill status={p.workflowStatus} tone={WORKFLOW_TONE[p.workflowStatus]} />
              </div>
              <div className="mt-2">
                <BarrierDetail p={p} />
              </div>
              <div className="mt-3">
                <NextAction p={p} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
