// Small reusable UI pieces: risk badges, status badges, and inline icons.
import { useEffect, useId, useRef, useState } from "react";

const RISK_STYLES = {
  High: "bg-red-100 text-red-700 ring-red-200",
  Medium: "bg-amber-100 text-amber-700 ring-amber-200",
  Low: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const RISK_DOT = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

export function RiskBadge({ level }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        RISK_STYLES[level] || RISK_STYLES.Low
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOT[level] || RISK_DOT.Low}`} />
      {level} risk
    </span>
  );
}

// Workflow status pill — visually distinct from the risk badge so the two concepts
// (how worrying vs. where it sits operationally) never get confused.
export function WorkflowPill({ status, tone }) {
  const tones = {
    red: "bg-red-100 text-red-700 ring-red-200",
    amber: "bg-amber-100 text-amber-700 ring-amber-200",
    blue: "bg-blue-100 text-blue-700 ring-blue-200",
    green: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        tones[tone] || tones.slate
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">Status</span>
      {status}
    </span>
  );
}

// Badge marking a signal that maps to a standard FHIR resource. Only shown for
// clinical/interop signals — operational signals (geography, transport) have none.
export function FhirBadge({ resource }) {
  if (!resource) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700">
      <span className="opacity-70">FHIR</span> {resource}
    </span>
  );
}

// Small badge marking a signal's lifecycle state.
export function SignalStateBadge({ state }) {
  const map = {
    active: { label: "Active", cls: "bg-slate-800 text-white" },
    resolved: { label: "Resolved", cls: "bg-emerald-100 text-emerald-700" },
    historical: { label: "Historical", cls: "bg-slate-100 text-slate-500" },
  };
  const s = map[state] || map.active;
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
      {initials}
    </div>
  );
}

// Minimal inline SVG icons so we need no icon dependency.
export const Icon = {
  Pin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M12 9v4m0 4h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Block: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8 8 8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Spark: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M12 3l1.8 4.9L19 9.6l-4.3 2.9L15.5 18 12 15.3 8.5 18l.8-5.5L5 9.6l5.2-1.7L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  Send: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M4 12l16-7-7 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M4 5c0 8 7 15 15 15l2-3-4-2-2 2a12 12 0 0 1-6-6l2-2-2-4-3 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  Video: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15 10 6-3v10l-6-3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  Car: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M5 16V11l2-5h10l2 5v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 16h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Doc: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M7 3h7l5 5v13H7V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Building: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  Heart: (p) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} {...p}>
      <path d="M12 20s-7-4.3-9.2-9A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9.2 5c-2.2 4.7-9.2 9-9.2 9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
};

// Map a source-system key to an icon for the Connected Signals view.
export const SIGNAL_ICON = {
  PCP_EHR: Icon.Building,
  PAYER: Icon.Shield,
  SCHEDULING: Icon.Calendar,
  GEOGRAPHY: Icon.Pin,
  TRANSPORT: Icon.Car,
  TELEHEALTH: Icon.Video,
  SPECIALIST_EHR: Icon.Doc,
  INTAKE: Icon.Phone,
  OUTREACH: Icon.Phone,
  CAREBRIDGE: Icon.Spark,
};

// Color tone for signal cards: good (green), warn (amber), bad (red), neutral (slate).
export const SIGNAL_TONE = {
  good: { dot: "bg-emerald-500", ring: "border-emerald-200", icon: "text-emerald-600 bg-emerald-50" },
  warn: { dot: "bg-amber-500", ring: "border-amber-200", icon: "text-amber-600 bg-amber-50" },
  bad: { dot: "bg-red-500", ring: "border-red-200", icon: "text-red-600 bg-red-50" },
  neutral: { dot: "bg-slate-400", ring: "border-slate-200", icon: "text-slate-600 bg-slate-100" },
};

// Accessible info tooltip/popover. Opens on hover, click/tap, and keyboard focus;
// closes on outside click, Escape, and blur. Keeps the circled "i" icon style.
// Does NOT rely on the browser's default `title` attribute.
export function InfoTooltip({ title, body, note, label = "More information" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const id = useId();

  // Dismiss on outside click/tap.
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold text-slate-400 transition hover:border-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        i
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-cardhover"
        >
          {title && <span className="block text-xs font-semibold text-slate-900">{title}</span>}
          {body && <span className="mt-1 block text-xs leading-relaxed text-slate-600">{body}</span>}
          {note && <span className="mt-1.5 block text-[11px] italic text-slate-400">{note}</span>}
          {/* little arrow */}
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
        </span>
      )}
    </span>
  );
}
