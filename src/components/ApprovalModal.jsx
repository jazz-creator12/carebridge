import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./ui.jsx";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Human-in-the-loop confirmation. CareBridge never changes patient state on its own:
// the coordinator must explicitly Approve. "Review alternatives" shows other options;
// "Cancel" (or Escape) closes with no change.
export default function ApprovalModal({ open, patient, proposal, onApprove, onCancel }) {
  if (!open || !proposal || !patient) return null;
  return <ApprovalDialog patient={patient} proposal={proposal} onApprove={onApprove} onCancel={onCancel} />;
}

function ApprovalDialog({ patient, proposal, onApprove, onCancel }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const altId = useId();

  // Initial focus, scroll lock, and focus restoration when the dialog closes.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && previouslyFocused.focus && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      } else {
        // The opener may have been replaced by the new state; fall back to the main region.
        document.getElementById("main-content")?.focus();
      }
    };
  }, []);

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    const items = panelRef.current?.querySelectorAll(FOCUSABLE);
    if (!items || items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/50" onClick={onCancel} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative max-h-[90vh] w-full max-w-md animate-fade-in overflow-y-auto rounded-2xl bg-white shadow-2xl focus:outline-none"
      >
        {/* Human approval banner */}
        <div className="flex items-center gap-2 rounded-t-2xl border-b border-amber-200 bg-amber-50 px-5 py-3">
          <Icon.Alert className="h-4 w-4 text-amber-800" />
          <span className="text-xs font-bold uppercase tracking-wide text-amber-900">Human approval required</span>
        </div>

        <div className="p-5">
          <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-brand-800">
            <Icon.Spark className="h-4 w-4" />
            CareBridge recommends
          </div>
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {proposal.label}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            for {patient.name} · {patient.specialty}
          </p>

          <div id={descId} className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="label-caps">Reason</div>
            <p className="mt-1 text-sm text-slate-800">{proposal.reason}</p>
          </div>

          {showAlternatives && (
            <div id={altId} className="mt-3 rounded-lg border border-slate-200 p-3">
              <div className="label-caps">Alternative options</div>
              <ul className="mt-2 space-y-1.5">
                {proposal.alternatives.map((alt) => (
                  <li key={alt} className="flex items-start gap-2 text-sm text-slate-800">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500" />
                    {alt}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-600">
                These alternatives are illustrative for the prototype and are not wired to change state.
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-600">
            CareBridge prepares and recommends. Nothing changes until you approve. Clinical decisions remain with
            qualified healthcare professionals.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={onApprove} className="btn btn-primary btn-lg w-full">
              <Icon.Check className="h-4 w-4" />
              Approve action
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                aria-expanded={showAlternatives}
                aria-controls={altId}
                onClick={() => setShowAlternatives((v) => !v)}
                className="btn btn-secondary flex-1"
              >
                {showAlternatives ? "Hide alternatives" : "Review alternatives"}
              </button>
              <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
