# CareBridge — Implementation Tasks

Checked items are implemented and verified in the app (production build passing; workflow
outcomes verified against the demo QA script). This spec was developed **iteratively with
Kiro** for implementation, debugging, workflow refinement, and QA.

## Foundation

- [x] Scaffold the app with React + Vite + Tailwind CSS
- [x] App shell, Inter font, base styling and layout
- [x] Fictional patient seed data model (`src/data/patients.js`)
- [x] Canonical 8-step referral journey + workflow-status and signal-state enums

## Dashboard / at-risk referral queue

- [x] At-risk referral queue ("these are the referrals that need human attention")
- [x] Summary cards (Active referrals, Needs attention, Urgent, On track)
- [x] Clickable summary cards that act as filters
- [x] Operational category filter chips (insurance / access / patient / specialist /
      closed-loop / on track), kept consistent with card/table membership
- [x] Coordination-impact demo metrics, labeled as fictional data
- [x] Distinct metric definitions: Actions taken vs. Barriers resolved vs. Returned on
      track vs. Referral loops closed; Active excludes Closed; On track = workflow status
- [x] "Avg. time stalled" accessible info tooltip (hover / click / keyboard)
- [x] "Why CareBridge?" value-proposition panel

## Patient journey / detail

- [x] Patient detail view with header (risk + workflow status)
- [x] Connected Signals grouped by Active / Resolved / Historical, with source labels
- [x] Expandable, rule-based "Why this risk level?" explainer (dynamic after actions)
- [x] Vertical referral journey timeline (completed-first display ordering)
- [x] Referral Action Center (detected problem / evidence / recommended action / effect)
- [x] Contextual secondary coordinator actions (state-aware visibility)

## Human-in-the-loop actions

- [x] Approval modal (Approve / Review alternatives / Cancel); state changes only on approve
- [x] Pure state-transition transforms (`src/lib/actions.js`), never mutating input
- [x] "Action taken" is distinct from "barrier resolved"
- [x] External-event path (`applyExternalEvent`) applied without approval

## Per-patient workflows

- [x] Sarah — rural access / telehealth: approve telehealth → appointment scheduled,
      transport barrier resolved, Low / On track, Slot → Historical, Appointment active
- [x] Maria — insurance / prior auth: approve escalation → stays High / Waiting on payer,
      barrier remains active, Actions taken +1 only, next action = monitor payer response
- [x] David — specialist capacity: approve alternate specialist → Dr. Owens, 12-day
      availability, capacity barrier resolved, Low / On track, appointment remains Pending
- [x] Robert — patient confirmation: approve contact → prototype-simulated successful
      confirmation, Low / On track (Contact patient hidden afterward)
- [x] Emily — closed-loop note: approve request (barrier stays open, Waiting on specialist)
      then simulated incoming Specialist EHR note (no approval) → received + routed to PCP
      → Closed, loops closed +1, not counted as returned-on-track
- [x] James — on track: no consequential intervention needed

## AI Coordinator

- [x] Rule-based AI panel that reads live state (`src/lib/aiCoordinator.js`)
- [x] Prioritization, barrier explanation, next-action, drafting, PCP summary answers
- [x] State-aware answers (e.g. Maria "waiting on payer"; Emily "loop closed, no action")
- [x] State-aware suggested prompt chips

## FHIR alignment

- [x] FHIR R4 tags on clinical/interop signals (ServiceRequest / Appointment / Slot /
      CoverageEligibilityResponse / DocumentReference)
- [x] Operational signals intentionally left without FHIR resources
- [x] "How CareBridge connects systems" architecture explainer
- [x] "FHIR-aligned simulated integration" labeling; readable resource casing
- [x] Correct source attribution (CareBridge/Coordinator actions vs. payer/specialist)

## Live interoperability proof (isolated)

- [x] Isolated `LiveFhirProof` panel reading the Oracle Health Millennium Open FHIR Sandbox
- [x] Browser `fetch` with `Accept: application/fhir+json`; no auth / keys / env / writes
- [x] Displayed Patient fields parsed from the live JSON response
- [x] Loading / Connected / failure states with a Retry button; contained, no uncaught errors
- [x] Synthetic-data labeling; not presented as a CareBridge referral patient

## QA and consistency

- [x] End-to-end workflow QA across all six patients
- [x] Dashboard count consistency (cards / chips / table / metrics)
- [x] Risk-vs-workflow-status separation
- [x] Signal lifecycle (active / resolved / historical / superseded) correctness
- [x] Journey display-order consistency (completed-first), presentation-only
- [x] Production build verified (`npm run build`) after each change

## Deployment

- [ ] Deploy the static `dist/` build to Vercel
      (The app is a static SPA and is Vercel-ready — build succeeds and the sandbox call
      works client-side via CORS — but no Vercel deployment artifact exists in this repo
      yet, so this item is left unchecked for accuracy.)

## .kiro project artifacts

- [x] Steering docs: product.md, tech.md, structure.md
- [x] Spec: requirements.md, design.md, tasks.md
