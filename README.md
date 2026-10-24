# CareBridge

CareBridge is a cross-system referral coordination layer designed to help rural healthcare teams identify and resolve referral failures across disconnected systems.

Instead of replacing the EHR, CareBridge monitors the gaps between primary care, payer authorization, specialist scheduling, telehealth, patient outreach, and specialist-to-PCP handoff.

## Live Demo

https://carebridge-mocha.vercel.app/

## Challenge Track

**Healthcare & Biotech — Improving Healthcare Access and Coordination**

## The Problem

Referral coordinators often have to manually check multiple systems to understand why a patient has not progressed through specialty care.

Common failure points include:

- Prior authorization delays
- Limited specialist availability
- Long travel distances
- Transportation barriers
- Patients not confirming appointments
- Specialist visits occurring without information returning to the PCP

These problems are especially significant for rural patients.

## What CareBridge Does

CareBridge:

- Monitors referral progression across multiple system signals
- Identifies referrals that need human attention
- Explains why a referral is at risk
- Recommends the next administrative action
- Requires human approval for consequential actions
- Continues monitoring after an action is taken
- Distinguishes between “action taken” and “barrier resolved”
- Tracks closed-loop completion back to the PCP

CareBridge does **not** diagnose patients, recommend clinical treatment, or replace clinicians or systems of record.

## Demo Workflows

The prototype contains six fictional patient journeys:

### Sarah Miller — Rural Access

A cardiology referral is stalled because of a 74-mile travel distance and lack of reliable transportation.

CareBridge identifies an available telehealth option. After coordinator approval, the telehealth appointment is scheduled and the access barrier is resolved.

### Maria Lopez — Prior Authorization

A neurology referral is blocked by pending prior authorization.

CareBridge allows the coordinator to escalate authorization follow-up. The referral remains high risk and waiting on the payer until an external payer response resolves the barrier.

### David Chen — Specialist Capacity

An orthopedic referral faces an 11-week specialist wait.

CareBridge identifies an alternate in-network specialist with availability in 12 days. Selecting the alternate specialist resolves the capacity barrier, while appointment scheduling remains a separate pending step.

### Robert Williams — Patient Confirmation

A gastroenterology appointment is scheduled, but the patient has not confirmed after multiple outreach attempts.

The prototype simulates a successful coordinator contact and patient confirmation.

### Emily Johnson — Closed-Loop Handoff

The specialist visit occurred, but the specialist summary did not return to the PCP.

CareBridge recommends requesting the note. The coordinator approves the request, but the referral remains unresolved until a simulated external Specialist EHR event returns the document.

The specialist summary is represented as a FHIR `DocumentReference`. Only after the information returns to the PCP does CareBridge close the referral loop.

### James Rodriguez — On Track

A dermatology telehealth referral is progressing normally.

CareBridge recognizes that no intervention is currently required.

## FHIR Interoperability

CareBridge models healthcare interoperability using HL7 FHIR R4 concepts including:

- `ServiceRequest` — referral
- `Slot` — appointment availability
- `Appointment` — booked or attended visit
- `CoverageEligibilityResponse` — payer/coverage signal
- `DocumentReference` — specialist document returned to the PCP

The main referral workflows use fictional, deterministic demo data.

The dashboard also includes an isolated **Live interoperability proof** that reads a real FHIR `Patient` resource from the Oracle Health Millennium Open FHIR Sandbox.

The sandbox data is synthetic/test data and is not connected to CareBridge's fictional referral patients.

Failure of the external sandbox does not affect the CareBridge demo workflows.

## Human-in-the-Loop Design

CareBridge separates three concepts:

1. **AI / coordination logic identifies and explains a problem**
2. **A human approves consequential administrative actions**
3. **External systems provide signals that determine whether the barrier is actually resolved**

For example, sending a prior-authorization escalation does not automatically clear the patient's insurance barrier.

## Technology

- React
- Vite
- Tailwind CSS
- JavaScript
- Local React state for deterministic prototype workflows
- HL7 FHIR-aligned resource modeling
- Oracle Health Millennium Open FHIR Sandbox
- Vercel deployment

No production patient data is used.

## Running Locally

Requirements:

- Node.js
- npm

Clone the repository and run:

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

To create a production build:

```bash
npm run build
```

## Testing Instructions

The easiest way to evaluate CareBridge is through the public deployment:

https://carebridge-mocha.vercel.app/

No account or login is required.

Recommended test sequence:

1. Open the dashboard and review the referral queue.
2. Open **Emily Johnson**.
3. Choose **Review & approve** for the specialist-note request.
4. Approve the action.
5. Observe that the referral remains unresolved.
6. Trigger **Simulate incoming specialist note**.
7. Observe the FHIR `DocumentReference`, completed PCP handoff, and closed referral.
8. Open **Maria Lopez** and approve the authorization escalation.
9. Observe that Maria remains high risk and waiting on the payer.
10. Open **Sarah Miller** and approve the telehealth action.
11. Observe the historical FHIR `Slot`, active FHIR `Appointment`, and resolved access barrier.
12. Expand **Live interoperability proof** on the dashboard to view a live FHIR R4 response from the Oracle Health developer sandbox.

## Kiro Usage

CareBridge was developed using **Kiro IDE** for iterative implementation, workflow refinement, debugging, QA, and specification-driven development.

The repository includes the required `.kiro` directory containing:

- Product steering
- Technical steering
- Project structure documentation
- Referral-orchestration requirements
- Design documentation
- Implementation task tracking

See:

`.kiro/steering/`

and:

`.kiro/specs/carebridge-referral-orchestration/`

## Important Prototype Boundaries

This is a hackathon prototype.

- Patient records are fictional or synthetic.
- Referral workflows are simulated for deterministic demonstration.
- The Oracle Health sandbox connection is a public developer sandbox.
- CareBridge is not a production clinical system.
- CareBridge does not make clinical decisions.
- No real PHI is stored or processed by the prototype.
