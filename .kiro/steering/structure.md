# CareBridge — Project Structure

A small Vite + React app. Everything lives under `src/`, with a clear split between the
**simulated referral-coordination demo** and the **isolated live FHIR sandbox proof**.

## Tree

```
/
├── index.html                      # app shell + Inter font
├── package.json                    # React / Vite / Tailwind
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore                      # node_modules, dist, .env*, .DS_Store (NOT .kiro)
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # root: holds live patient state + approval modal state
│   ├── index.css                   # Tailwind layers + small keyframes
│   ├── data/
│   │   └── patients.js             # fictional seed data, journey steps, FHIR/workflow enums
│   ├── lib/
│   │   ├── actions.js              # action proposals + state-transition transforms
│   │   └── aiCoordinator.js        # rule-based AI responder (reads live state)
│   └── components/
│       ├── Dashboard.jsx           # at-risk referral queue, metrics, filters, Why CareBridge
│       ├── PatientJourney.jsx      # per-patient detail: signals, risk, timeline, action center
│       ├── ApprovalModal.jsx       # human-in-the-loop confirmation
│       ├── AICoordinator.jsx       # slide-in AI chat panel
│       ├── LiveFhirProof.jsx       # ISOLATED live Oracle FHIR sandbox panel
│       └── ui.jsx                  # shared badges/icons/tooltip/pills
└── .kiro/                          # steering + specs (this directory)
```

## Major areas

### Patient seed data — `src/data/patients.js`
The single source of fictional truth. Defines the six demo patients, the eight canonical
`JOURNEY_STEPS`, dashboard `CATEGORIES`, `WORKFLOW` statuses and tones, `SIGNAL_STATE`
(active/resolved/historical), the `FHIR_RESOURCES` map, the architecture-explainer rows,
and `ACTION_LABELS`. Each patient carries its signals (with source + optional FHIR tag),
risk reasons, action-center copy, journey statuses, and timeline notes.

### Action / state-transition logic — `src/lib/actions.js`
Pure functions, never mutating input:
- `getActionProposal(patient)` — what the approval modal shows.
- `applyActionToPatient(patient, actionType)` — the effect of an **approved coordinator
  action** (telehealth, escalation, alternate specialist, contact, note request).
- `applyExternalEvent(patient, eventType)` — the effect of an **external system event**
  (specialist note received), applied with no human approval.
This is where the "an action is not the same as resolving the barrier" rule lives.

### AI coordinator logic — `src/lib/aiCoordinator.js`
A rule-based responder. `askCoordinator(question, patients)` pattern-matches the question
and reads the **live** patient state, so answers change after actions. `getSuggestedQuestions(patients)`
returns state-aware prompt chips. No LLM, no network.

### Dashboard — `src/components/Dashboard.jsx`
The operational "these are the referrals that need human attention" queue: clickable
summary cards (which are also filters), coordination-impact demo metrics, category filter
chips, the referral table/cards, the "Why CareBridge?" positioning panel, and the live
FHIR proof panel. All counts derive from the shared live patient state.

### Patient journey / detail — `src/components/PatientJourney.jsx`
Per-patient page: Connected Signals (grouped active/resolved/historical, with source and
FHIR badges), an expandable "Why this risk level?" explainer, a vertical referral journey
timeline (display-ordered completed-first), the Referral Action Center, contextual
secondary actions, and an AI shortcut.

### Approval + actions — `src/components/ApprovalModal.jsx`
The human-in-the-loop gate. Consequential actions only change state after the coordinator
clicks Approve.

### AI panel — `src/components/AICoordinator.jsx`
Slide-in chat that calls `askCoordinator` with the live patient list.

### Shared UI — `src/components/ui.jsx`
Risk/workflow/status pills, signal-state and FHIR badges, inline SVG icons, and the
accessible `InfoTooltip`.

## Separation: demo state vs. live sandbox proof

The referral-coordination demo (patients, actions, metrics, AI, approvals) is **entirely
simulated and deterministic** and lives in `data/`, `lib/`, and the referral components.

The **live FHIR proof** lives in exactly one file, `components/LiveFhirProof.jsx`. It has
its own `fetch`/loading/error/data state, imports nothing from the referral modules (only
the shared `Icon` helper), and injects nothing back into patient state. A sandbox failure
is contained to that panel and cannot affect any CareBridge workflow.
