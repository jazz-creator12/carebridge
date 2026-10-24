# CareBridge — Requirements

CareBridge is a cross-system referral orchestration layer. It observes signals from the
systems a clinic already uses, surfaces stalled referrals, explains why they are stalled,
and recommends administrative next actions for a human to approve. All patient data is
fictional; core workflows are simulated and deterministic.

Requirements use EARS-style phrasing where helpful. "The system" = CareBridge.

## 1. Exception detection (the at-risk queue)

1.1 The system SHALL monitor active specialist referrals and surface the ones that have
stalled or broken, highest risk first.

1.2 WHEN a referral has not progressed past an expected workflow step, the system SHALL
flag it as needing attention and record how long it has been stalled.

1.3 The system SHALL present an operational queue (not a plain patient list) organized by
category: blocked by insurance, blocked by access, waiting on patient, waiting on
specialist, closed-loop gap, and on track.

## 2. Barrier explanation and source signal

2.1 For each at-risk referral, the system SHALL state the main barrier in plain language.

2.2 The system SHALL identify the **primary signal / source system** that surfaced the
barrier, while making clear that CareBridge (not the external system) performs the
detection.

2.3 The system SHALL provide a transparent, rule-based "Why this risk level?" explanation.
It SHALL NOT present risk as an opaque predictive score and SHALL NOT imply clinical
prediction. Explanations SHALL update to reflect the current state after actions.

## 3. Recommended administrative next action

3.1 For each at-risk referral, the system SHALL recommend a single administrative next
action with the detected problem, the evidence, and the expected workflow effect.

3.2 Recommended actions SHALL be administrative/coordination only. The system SHALL NOT
produce diagnoses or treatment recommendations.

## 4. Human-in-the-loop approval

4.1 The system SHALL require explicit human approval before any **consequential** action
changes referral state (offer telehealth, escalate authorization, offer alternate
specialist, contact patient, request specialist note, etc.).

4.2 WHEN a coordinator requests a consequential action, the system SHALL present a
confirmation with the recommendation and reason, and options to approve, review
alternatives, or cancel. State SHALL change only on approve.

4.3 The system SHALL NOT make consequential decisions automatically.

## 5. Action ≠ resolution

5.1 Taking an action SHALL NOT automatically mark the underlying barrier resolved.

5.2 Some actions SHALL truly resolve the barrier (e.g. telehealth scheduled, alternate
specialist selected, patient confirmed) and move the referral toward On track.

5.3 Some actions SHALL only start a process (e.g. authorization escalation sent, note
requested); the barrier SHALL remain active and the workflow status SHALL reflect
"waiting on" the responsible external party until a response arrives.

## 6. Monitoring external system responses

6.1 The system SHALL distinguish coordinator-initiated actions from facts received from
external systems.

6.2 WHEN an external system returns a result (e.g. a specialist summary), the system SHALL
update the observed workflow state **without** requiring human approval, because receiving
a fact is not a coordinator decision.

## 7. Referral failure modes

The system SHALL demonstrate these distinct exception types:

7.1 **Rural access / telehealth** — long distance + no transportation; resolving by
offering a telehealth appointment removes the travel barrier.

7.2 **Insurance / prior authorization** — scheduling blocked by a pending payer decision;
escalation is an action, not a resolution.

7.3 **Specialist capacity** — the chosen specialist's wait is too long; an in-network
alternate with sooner availability can be offered (availability identified ≠ appointment
booked).

7.4 **Patient confirmation** — a booked appointment is unconfirmed after outreach;
confirming resolves the engagement barrier (labeled as a prototype-simulated outcome).

7.5 **Closed-loop specialist-note return** — the visit is complete but the summary never
reached the PCP; the loop closes only after the note is received and routed.

7.6 **On track** — a referral with no unresolved barrier requires no intervention.

## 8. Closed-loop completion

8.1 The system SHALL keep monitoring after scheduling and after the specialist visit.

8.2 A referral SHALL be considered **Closed** only after the specialist information is
returned to the PCP and the handoff is confirmed.

8.3 A completed/closed referral SHALL NOT be counted as "returned to an active on-track
state."

## 9. Dashboard metrics

9.1 The system SHALL display demo metrics clearly labeled as based on fictional data.

9.2 The system SHALL treat these as distinct, non-interchangeable values: Active referrals
(excluding Closed), Needs attention, Urgent, On track (workflow status On track only),
Actions taken, Barriers resolved, Returned on track, Referral loops closed, and Average
time stalled.

9.3 Summary cards, filter chips, and the patient table SHALL use consistent definitions.

## 10. FHIR-aligned interoperability

10.1 The system SHALL align clinical/interop signals to standard FHIR R4 resource types:
ServiceRequest (referral), Appointment (booked), Slot (availability), CoverageEligibility-
Response (payer coverage/prior auth), DocumentReference (specialist summary).

10.2 Operational/contextual signals (geography, transportation, coordinator actions) SHALL
NOT be forced into FHIR resources.

10.3 The system SHALL clearly label FHIR alignment as a simulated prototype and SHALL NOT
claim certification or production integration.

## 11. Optional live interoperability proof

11.1 The system SHALL include an isolated panel that reads a live FHIR R4 Patient resource
from the Oracle Health Millennium Open FHIR Sandbox (read-only, public, no auth).

11.2 Displayed values SHALL be parsed from the live JSON response, not hard-coded.

11.3 The panel SHALL be fully isolated from referral workflows, metrics, risk, and AI.

11.4 IF the fetch fails for any reason, the system SHALL contain the failure within the
panel (a clear message plus a Retry option), with no uncaught errors and no effect on any
CareBridge workflow.

11.5 The panel SHALL clearly state the data is synthetic sandbox data and is not one of
the CareBridge referral patients.

## 12. Safety and boundaries

12.1 The system SHALL NOT diagnose, recommend treatment, or replace clinicians or EHRs.

12.2 The system SHALL use entirely fictional patient data for the referral workflows.

12.3 The system SHALL keep clinical decisions with qualified healthcare professionals.
