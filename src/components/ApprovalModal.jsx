import { useState } from "react";
import { Icon } from "./ui.jsx";

// Human-in-the-loop confirmation. CareBridge never changes patient state on its own —
// the coordinator must explicitly Approve. "Review alternatives" shows other options;
// "Cancel" closes with no change.
export default function ApprovalModal({ open, patient, proposal, onApprove, onCancel }) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!open || !proposal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-md animate-fade-in rounded-2xl bg-white shadow-2xl">
        {/* Human approval banner */}
        <div className="flex items-center gap-2 rounded-t-2xl border-b border-amber-200 bg-amber-50 px-5 py-3">
          <Icon.Alert className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
            Human approval required
          </span>
        </div>

        <div className="p-5">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-brand-600">
            <Icon.Spark className="h-4 w-4" />
            CareBridge recommends
          </div>
          <h3 className="text-lg font-bold text-slate-900">{proposal.label}</h3>
          <p className="mt-1 text-sm text-slate-500">for {patient.name} · {patient.specialty}</p>

          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</div>
            <p className="mt-1 text-sm text-slate-700">{proposal.reason}</p>
          </div>

          {showAlternatives && (
            <div className="mt-3 rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Alternative options
              </div>
              <ul className="mt-2 space-y-1.5">
                {proposal.alternatives.map((alt) => (
                  <li key={alt} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                    {alt}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-400">
                These alternatives are illustrative for the prototype and are not wired to change state.
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            CareBridge prepares and recommends. Nothing changes until you approve. Clinical decisions
            remain with qualified healthcare professionals.
          </p>

          {/* Buttons */}
          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={onApprove}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              <Icon.Check className="h-4 w-4" />
              Approve action
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAlternatives((v) => !v)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {showAlternatives ? "Hide alternatives" : "Review alternatives"}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
