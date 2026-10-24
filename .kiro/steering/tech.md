# CareBridge — Technology

CareBridge is a client-only single-page application. It is intentionally simple so the
hackathon demo is deterministic and easy to run locally.

## Stack

- **React 18** — UI components and local state.
- **Vite 5** — dev server and production build.
- **Tailwind CSS 3** — styling (utility classes; no component library).
- **JavaScript (JSX)** — no TypeScript.
- **Inter** web font (loaded via Google Fonts in `index.html`).

Run locally:

```bash
npm install
npm run dev     # Vite dev server (http://localhost:5173)
npm run build   # production build to dist/
```

## State & data

- All application state lives in **local React state** (`useState` in `App.jsx`),
  seeded from a deep clone of the fictional patient data so the original mock file is
  never mutated.
- **All patient data is fictional / synthetic.** There is no real PHI.
- There is **no production backend, no database, and no authentication**. Refreshing the
  browser resets the demo to its starting scenario, which is convenient for re-running
  the demo.
- The "AI Referral Coordinator" is a **rule-based** assistant that reads the live mock
  state. It is not a hosted LLM and requires no API key.

## FHIR alignment (simulated)

The simulated cross-system signals are aligned to standard **FHIR R4** resource types so
the architecture reads as interoperable rather than proprietary. These mappings are
**display/label alignments on simulated data**, not live integrations:

- **ServiceRequest** — the referral itself (referral placed / referral lifecycle).
- **Appointment** — a booked/scheduled appointment (including telehealth once booked).
- **Slot** — an *available* appointment time that has not yet been booked.
- **CoverageEligibilityResponse** — payer coverage and prior-authorization responses.
- **DocumentReference** — the specialist visit summary / clinical note.

Operational/contextual signals (geography, transportation, patient-reported access,
coordinator actions) intentionally have **no** FHIR resource — they are not standardized
interoperability records and are labeled by their real simulated source instead.

## Live interoperability proof (isolated)

One small, isolated panel reads a **live** FHIR R4 `Patient` resource from the
**Oracle Health Millennium Open FHIR Sandbox** (a public, read-only developer sandbox):

```
GET https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/12724067
Accept: application/fhir+json
```

- Browser `fetch()` only; the sandbox returns `Access-Control-Allow-Origin: *`, so **no
  backend/proxy is needed**.
- **No auth, no API keys, no environment variables, no write operations.** The endpoint
  is hard-coded because it is a public developer sandbox.
- Returned values are **parsed from the JSON response**, not hard-coded.
- The panel is **completely isolated** from CareBridge's referral workflows. If the fetch
  fails, the failure is contained to the panel (contained message + Retry) and cannot
  affect any demo workflow.

This is a demonstration of the *intended* interoperability architecture. It is **not** a
production Oracle integration, not an Epic integration, not FHIR certified, and the
sandbox returns synthetic/test data only.

## Determinism

The core demo workflows (Sarah, Maria, David, Robert, Emily, James) are **simulated and
deterministic** so the hackathon demonstration is repeatable. The only live network call
in the app is the optional, isolated Oracle sandbox proof.

## Deployment

The static build (`dist/`) is deployed to **Vercel** as a static single-page app. No
server-side runtime is required.
