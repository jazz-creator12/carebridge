import { useId, useState } from "react";
import { Icon } from "./ui.jsx";

// ---------------------------------------------------------------------------
// Live interoperability proof: Oracle Health Millennium Open FHIR Sandbox.
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
  const panelId = useId();

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
    <section aria-labelledby={`${panelId}-title`} className="card">
      <h2 id={`${panelId}-title`}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl px-5 py-3 text-left"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span className="text-sm font-semibold text-slate-900">Live interoperability proof</span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800 ring-1 ring-inset ring-teal-200">
              Live FHIR sandbox
            </span>
          </span>
          <Icon.Chevron className={`h-4 w-4 flex-shrink-0 text-slate-600 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </h2>

      {open && (
        <div id={panelId} className="border-t border-slate-200 px-5 py-4">
          <div className="text-sm font-medium text-slate-800">Oracle Health Millennium Open FHIR Sandbox</div>
          <p className="mb-3 mt-1 text-sm text-slate-600">
            This panel reads a live FHIR Patient resource from Oracle Health&apos;s public developer sandbox.
            CareBridge&apos;s referral workflows remain simulated for deterministic hackathon demonstration.
          </p>

          {/* Status changes are announced politely to assistive technology. */}
          <div role="status" aria-live="polite">
            {status === "loading" && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-brand-600 motion-safe:animate-spin" aria-hidden="true" />
                Connecting to Oracle Health FHIR sandbox…
              </div>
            )}

            {status === "error" && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Icon.Alert className="h-4 w-4" />
                  Live sandbox temporarily unavailable
                </div>
                <p className="mt-1 text-sm text-amber-900">
                  CareBridge demo workflows remain available because the sandbox proof is isolated from referral
                  coordination logic.
                </p>
                <button type="button" onClick={load} className="btn btn-secondary btn-sm mt-2">
                  Retry
                </button>
              </div>
            )}

            {status === "success" && data && (
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                  <Icon.Check className="h-4 w-4" />
                  Connected · Live FHIR R4 response
                </div>

                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <Field label="Resource type" value={data.resourceType} />
                  <Field label="Resource ID" value={data.id} />
                  <Field label="Patient name" value={data.name} />
                  <Field label="Administrative gender" value={data.gender} />
                  <Field label="Birth date" value={data.birthDate} />
                  <Field label="Source" value="Oracle Health Millennium Open FHIR Sandbox" />
                </dl>

                <div className="mt-3">
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                    Live sandbox data · synthetic/test data
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Not one of the CareBridge referral patients. Read-only public developer sandbox: not a production
                  Oracle or Epic integration, not FHIR certified, and not real patient data.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-900">{value}</dd>
    </div>
  );
}
