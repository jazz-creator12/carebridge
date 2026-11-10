import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Icons: one consistent 24px grid, 1.75 stroke, decorative by default (aria-hidden).
// ---------------------------------------------------------------------------
function makeIcon(children) {
  return function IconComponent({ className = "h-4 w-4" }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        {children}
      </svg>
    );
  };
}

export const Icon = {
  Pin: makeIcon(
    <>
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  Calendar: makeIcon(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  Alert: makeIcon(
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  Check: makeIcon(<path d="M20 6 9 17l-5-5" />),
  Clock: makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  Block: makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 8 8 8" />
    </>
  ),
  Chevron: makeIcon(<path d="m9 18 6-6-6-6" />),
  ArrowRight: makeIcon(<path d="M5 12h14M13 6l6 6-6 6" />),
  Close: makeIcon(<path d="m6 6 12 12M18 6 6 18" />),
  Spark: makeIcon(<path d="M12 3l1.8 4.9L19 9.6l-4.3 2.9L15.5 18 12 15.3 8.5 18l.8-5.5L5 9.6l5.2-1.7L12 3Z" />),
  Send: makeIcon(<path d="M4 12l16-7-7 16-2.5-6.5L4 12Z" />),
  Phone: makeIcon(<path d="M4 5c0 8 7 15 15 15l2-3-4-2-2 2a12 12 0 0 1-6-6l2-2-2-4-3 2Z" />),
  Video: makeIcon(
    <>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="m15 10 6-3v10l-6-3" />
    </>
  ),
  Car: makeIcon(
    <>
      <path d="M5 16V11l2-5h10l2 5v5" />
      <path d="M3 16h18" />
      <circle cx="8" cy="18" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
    </>
  ),
  Doc: makeIcon(
    <>
      <path d="M7 3h7l5 5v13H7V3Z" />
      <path d="M14 3v5h5M9 13h6M9 16h6" />
    </>
  ),
  Building: makeIcon(
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" />
    </>
  ),
  Shield: makeIcon(<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z" />),
  Heart: makeIcon(<path d="M12 20s-7-4.3-9.2-9A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9.2 5c-2.2 4.7-9.2 9-9.2 9Z" />),
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

// Signal tone: icon chip + status dot colors (text is always carried by words, not color).
export const SIGNAL_TONE = {
  good: { dot: "bg-emerald-600", icon: "bg-emerald-50 text-emerald-700", bar: "border-l-emerald-500" },
  warn: { dot: "bg-amber-600", icon: "bg-amber-50 text-amber-800", bar: "border-l-amber-500" },
  bad: { dot: "bg-red-600", icon: "bg-red-50 text-red-700", bar: "border-l-red-500" },
  neutral: { dot: "bg-slate-500", icon: "bg-slate-100 text-slate-700", bar: "border-l-slate-400" },
};

// ---------------------------------------------------------------------------
// Badges and pills
// ---------------------------------------------------------------------------
// Risk: rounded-full pill with a dot AND a text label (never color alone).
const RISK_STYLES = {
  High: { box: "bg-red-50 text-red-800 ring-red-200", dot: "bg-red-600" },
  Medium: { box: "bg-amber-50 text-amber-900 ring-amber-200", dot: "bg-amber-600" },
  Low: { box: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-600" },
};

export function RiskBadge({ level }) {
  const s = RISK_STYLES[level] || RISK_STYLES.Low;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.box}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {level} risk
    </span>
  );
}

// Workflow status: squarer tinted tag, visually distinct from the round risk pill.
const WORKFLOW_STYLES = {
  red: "bg-red-50 text-red-800 border-red-200",
  amber: "bg-amber-50 text-amber-900 border-amber-200",
  blue: "bg-brand-50 text-brand-800 border-brand-200",
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export function WorkflowPill({ status, tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${
        WORKFLOW_STYLES[tone] || WORKFLOW_STYLES.slate
      }`}
    >
      <span className="sr-only">Workflow status: </span>
      {status}
    </span>
  );
}

const STATUS_STYLES = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-brand-50 text-brand-800",
  green: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-900",
  red: "bg-red-50 text-red-800",
};

export function StatusPill({ children, tone = "slate" }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[tone]}`}>
      {children}
    </span>
  );
}

// Badge for a signal that maps to a standard FHIR resource. Operational signals have none.
export function FhirBadge({ resource }) {
  if (!resource) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-800">
      <span className="font-medium text-teal-700">FHIR</span> {resource}
    </span>
  );
}

// Signal lifecycle badge: icon + word, so state is never carried by color alone.
export function SignalStateBadge({ state }) {
  const map = {
    active: { label: "Active", cls: "bg-slate-900 text-white", icon: null },
    resolved: { label: "Resolved", cls: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200", icon: Icon.Check },
    historical: { label: "Historical", cls: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200", icon: Icon.Clock },
  };
  const s = map[state] || map.active;
  const IconComp = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {IconComp && <IconComp className="h-3 w-3" />}
      {s.label}
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
    <div
      aria-hidden="true"
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800"
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accessible info tooltip/popover.
// Opens on hover, click/tap and keyboard focus; closes on outside click, Escape and
// blur. 24px target. The popover is nudged so it never overflows the viewport.
// ---------------------------------------------------------------------------
export function InfoTooltip({ title, body, note, label = "More information" }) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef(null);
  const popRef = useRef(null);
  const id = useId();

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

  useLayoutEffect(() => {
    if (!open || !popRef.current) {
      setShift(0);
      return;
    }
    const r = popRef.current.getBoundingClientRect();
    const left = r.left - shift;
    const right = r.right - shift;
    const margin = 8;
    let dx = 0;
    if (left < margin) dx = margin - left;
    else if (right > window.innerWidth - margin) dx = window.innerWidth - margin - right;
    if (dx !== shift) setShift(dx);
  }, [open, shift]);

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
        className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
      >
        i
      </button>

      {open && (
        <span
          ref={popRef}
          id={id}
          role="tooltip"
          style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 max-w-[calc(100vw-1rem)] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-cardhover"
        >
          {title && <span className="block text-sm font-semibold text-slate-900">{title}</span>}
          {body && <span className="mt-1 block text-sm leading-relaxed text-slate-700">{body}</span>}
          {note && <span className="mt-1.5 block text-xs italic text-slate-600">{note}</span>}
          <span
            aria-hidden="true"
            style={{ left: `calc(50% - ${shift}px)` }}
            className="absolute top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-slate-200 bg-white"
          />
        </span>
      )}
    </span>
  );
}
