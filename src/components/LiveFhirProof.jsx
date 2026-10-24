import { useState } from "react";
import { Icon } from "./ui.jsx";

// ---------------------------------------------------------------------------
// Live interoperability proof — Oracle Health Millennium Open FHIR Sandbox.
//
// This component is COMPLETELY ISOLATED from CareBridge's referral workflows.
// It reads no patient state, writes no patient state, and imports nothing from
// the referral/data/action/AI modules. Its only job is to prove, live, that
// CareBridge can read a standardized FHIR R4 Patient resource from a public
// healthcare developer sandbox. If the fetch fails, it fails inside this panel
// only and cannot affect any CareBridge demo workflow.
//
// The endpoint is a public, read-only developer sandbox. No auth, no API keys,
// no environment variables, no write operations.
// ---------------------------------------------------------------------------

const SANDBOX_URL =
  "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/12724067";

// Build a readable name from a FHIR HumanName array.
function formatName(resource) {
  const names = resource?.name;
  if (!Array.isArray(names) || names.length === 0) return "—";
  // Prefer an official name, else the first one.
  const n = names.find((x) => x.use === "official") || names[0];
  if (n.text) return n.text;
  const given = Array.isArray(n.given) ? n.given.join(" ") : "";
  return [given, n.family].filter(Boolean).join(" ") || "—";
}

export default function LiveFhirProof() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [data, setData] = useState(null);

  async function load() {
    setStatus("loading");
    setData(null);
    try {
      const res = await fetch(SANDBOX_URL, {
        headers: { Accept: "application/fhir+json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Parse the fields we display directly from the live JSON response.
      setData({
        resourceType: json.resourceType || "—",
        id: json.id || "—",
        name: formatName(json),
        gender: json.gender || "—",
        birthDate: json.birthDate || "—",
      });
      setStatus("success");
    } catch (err) {
      // Contained failure: never rethrow, never touch CareBridge state.
      setStatus("error");
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    // Fetch on first expand (or re-expand if we don't yet have data).
    if (next && status !== "success" && status !== "loading") load();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-slate-900">Live interoperability proof</span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200">
            Live FHIR sandbox
          </span>
        </span>
        <Icon.Chevron className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-1 text-xs font-medium text-slate-500">Oracle Health Millennium Open FHIR Sandbox</div>
          <p className="mb-3 text-xs text-slate-400">
            This panel reads a live FHIR Patient resource from Oracle Health&apos;s public developer sandbox.
            CareBridge&apos;s referral workflows remain simulated for deterministic hackathon demonstration.
          </p>

          {status === "loading" && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
              Connecting to Oracle Health FHIR sandbox…
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Icon.Alert className="h-4 w-4" />
                Live sandbox temporarily unavailable
              </div>
              <p className="mt-1 text-xs text-amber-700">
                CareBridge demo workflows remain available because the sandbox proof is isolated from referral
                coordination logic.
              </p>
              <button
                onClick={load}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Retry
              </button>
            </div>
          )}

          {status === "success" && data && (
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <Icon.Check className="h-3.5 w-3.5" />
                Connected · Live FHIR R4 response
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Field label="Resource type" value={data.resourceType} />
                <Field label="Resource ID" value={data.id} />
                <Field label="Patient name" value={data.name} />
                <Field label="Administrative gender" value={data.gender} />
                <Field label="Birth date" value={data.birthDate} />
                <Field label="Source" value="Oracle Health Millennium Open FHIR Sandbox" />
              </dl>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Live sandbox data · synthetic/test data
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Not one of the CareBridge referral patients. Read-only public developer sandbox — not a production
                Oracle or Epic integration, not FHIR certified, and not real patient data.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  );
}
