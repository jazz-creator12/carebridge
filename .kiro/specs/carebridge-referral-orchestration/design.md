# CareBridge — Design

This documents the design as actually built: a client-only React app with a rule/state
based coordination model, a human-in-the-loop action layer, FHIR-aligned simulated
signals, and one isolated live FHIR sandbox proof.

## 1. Positioning: observer, not system of record

Existing systems (PCP EHR, payer, scheduling, telehealth, specialist EHR, transportation,
outreach) remain the **systems of record**. CareBridge does not store clinical data or
replace any of them. It **observes cross-system signals** and coordinates the referral
journey across the seams between them.

Conceptual flow:

```
EHR creates referral
  → CareBridge observes signals from multiple systems
  → CareBridge detects a cross-system exception
  → CareBridge recommends an administrative action
  → a human approves the consequential action
  → CareBridge keeps monitoring for new external signals
  → referral progresses or closes
```

## 2. Data model (fictional)

`src/data/patients.js` holds six fictional patients and the shared enums:

- `JOURNEY_STEPS` — the eight canonical steps: referral placed → insurance/authorization
  → specialist identified → appointment scheduled → access barrier resolved → visit
  completed → specialist information returned to PCP → referral closed.
- Each patient has: `risk` (High/Medium/Low), `workflowStatus` (Blocked, Needs action,
  Action in progress, Waiting on payer, Waiting on specialist, On track, Closed), a
  `category`, a `blockingSystem` (primary signal), `stalledDays`, a `journey` map of
  per-step statuses (done/blocked/pending), `timelineNotes`, `riskReasons`, an
  `actionCenter` (problem/evidence/action/effect), and `signals[]`.
- Each **signal** has an `id`, `system`, `source` label, a lifecycle `state`
  (active/resolved/historical), tone, text, and an **optional** `fhir` resource tag.

## 3. Risk and workflow logic (rule/state based)

Risk and workflow status are **separate concepts** and both are derived from transparent
operational rules, not predictions:

- **Risk** = how worrying the referral is (High/Medium/Low), explained by `riskReasons`.
- **Workflow status** = where the referral sits operationally.

Taking an action can change workflow status without lowering risk (see §5).

## 4. Human-in-the-loop action model

- `getActionProposal(patient)` (in `src/lib/actions.js`) returns what the approval modal
  shows: label, reason, and alternatives.
- The modal (`ApprovalModal.jsx`) offers **Approve / Review alternatives / Cancel**. No
  state changes until Approve.
- On approve, `App.jsx` calls `applyActionToPatient(patient, type)` and replaces that
  patient in local state with the returned (new) object. All views re-render from the
  shared state.

## 5. Action vs. resolution

`applyActionToPatient` encodes the key realism rule:

- **Resolving actions** (Sarah telehealth, David alternate specialist, Robert confirm)
  set `barrierResolved: true`, drop risk to Low, and set workflow status On track.
- **Progress-only actions** (Maria escalate authorization, Emily request note) set
  `actionTaken: true` but leave `barrierResolved: false`; risk stays elevated and the
  status becomes "Waiting on payer" / "Action in progress" until an external response.

## 6. External events update state separately

`applyExternalEvent(patient, eventType)` models a fact arriving from an external system
(e.g. `specialist_note` — the specialist summary returns). It runs **without an approval
modal**, because receiving a fact is not a coordinator decision. For Emily, this is what
actually closes the loop: it marks the note received (FHIR DocumentReference), routes it
to the PCP, completes the handoff, and sets the referral to Closed. This keeps the
human-in-the-loop model for *actions* while letting *observed facts* flow in on their own.

## 7. Signals and lifecycle

Signals are an auditable timeline. Actions never delete signals — they rewrite or append
and change a signal's `state`:

- **Active** — a current fact/problem.
- **Resolved** — a problem that has been cleared (e.g. "transportation barrier no longer
  blocks care").
- **Historical** — a past fact kept for context (e.g. a used telehealth Slot, or the
  74-mile distance after telehealth makes travel irrelevant).

The Connected Signals view groups signals by these states so judges can see the before/
after without losing the audit trail.

## 8. FHIR resource mappings (simulated)

Clinical/interop signals carry a FHIR R4 tag; operational signals do not:

| Signal | FHIR resource |
| --- | --- |
| Referral placed / referral lifecycle | `ServiceRequest` |
| Booked / scheduled appointment (incl. telehealth once booked) | `Appointment` |
| Available (not-yet-booked) appointment time | `Slot` |
| Payer coverage / prior-authorization response | `CoverageEligibilityResponse` |
| Specialist visit summary / clinical note | `DocumentReference` |
| Geography, transportation, patient intake, coordinator actions | *(none — operational)* |

A "How CareBridge connects systems" explainer shows each source system → its FHIR
resource → CareBridge, plus an operational-signal lane. All of this is labeled
**FHIR-aligned simulated integration**.

## 9. Isolation of the Oracle sandbox proof

`src/components/LiveFhirProof.jsx` is the only component that makes a live network call.
Design constraints:

- Reads one public, read-only sandbox endpoint with `Accept: application/fhir+json`.
- Hard-coded public URL; no auth, keys, env vars, or writes.
- Local `status`/`data` state only; imports nothing from the referral modules (only the
  shared `Icon`).
- Parses displayed fields from the live JSON.
- Contained failure path (message + Retry); never rethrows; cannot touch patient state.
- Clearly labeled as synthetic sandbox data and not a production/Epic/certified
  integration.

## 10. Frontend architecture

- `App.jsx` owns the live `patients` array (a deep clone of the seed), the selected
  patient, AI panel state, and the approval-modal state. It wires approvals and external
  events to the pure transforms in `actions.js`.
- `Dashboard.jsx`, `PatientJourney.jsx`, `AICoordinator.jsx`, `ApprovalModal.jsx`, and
  `ui.jsx` are presentation + interaction; the AI responder (`aiCoordinator.js`) is pure
  logic over the passed-in live state.
- Styling is Tailwind utility classes; no component library.

## 11. Data boundaries

- Referral-workflow data is **100% fictional/synthetic** and in-memory only.
- The Oracle sandbox returns **synthetic/test** data and is kept entirely separate from
  the referral patients.
- No real PHI, no persistence, no backend.
