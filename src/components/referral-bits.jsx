import { Icon } from "./ui.jsx";
import { ACTION_LABELS } from "../data/patients.js";

// What the coordinator should do next, shown with an icon + text (never color alone).
export function NextAction({ p }) {
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
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-sm font-semibold text-brand-800">
      {ACTION_LABELS[p.recommendedAction]}
      <Icon.ArrowRight className="h-4 w-4 flex-shrink-0" />
    </span>
  );
}

export function BarrierDetail({ p }) {
  const meta = [p.blockingSystem && `Primary signal: ${p.blockingSystem}`, p.stalledDays > 0 && `Stalled ${p.stalledDays} days`]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <div className="text-sm font-medium text-slate-900">{p.barrier}</div>
      {meta && <div className="mt-0.5 text-xs text-slate-600">{meta}</div>}
    </>
  );
}
