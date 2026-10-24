# CareBridge — Product Overview

CareBridge is a **cross-system referral orchestration layer** for specialist referrals.
It is not an EHR, not a diagnostic tool, and not a clinical decision-maker. It sits
on top of the systems a clinic already uses and watches whether a specialist referral
actually gets completed.

## What it does

A primary-care referral touches many disconnected systems — the PCP EHR, the payer,
specialist scheduling, transportation, telehealth, the specialist's EHR, and patient
outreach. Each of those systems knows only one part of the journey. CareBridge combines
their signals into one referral journey, detects when something has stalled or broken,
explains why, and recommends the next **administrative** action for a human to approve.

> Existing systems each know one part of the referral journey. CareBridge watches the
> gaps between them.

## Primary user

A **referral coordinator** or **patient navigator** working at a rural primary-care
clinic, community health center, or health system. They are the person responsible for
making sure a referral does not fall through the cracks.

## Who benefits

**Rural patients**, who are most likely to lose care to long travel distances, missing
transportation, insurance/prior-authorization delays, limited specialist capacity,
missed follow-up, and broken communication back to the PCP.

## The problem

Referrals break across the seams between systems:

- **Access / geography** — the nearest in-network specialist is far away.
- **Transportation** — the patient cannot reach the specialist.
- **Insurance / prior authorization** — scheduling is blocked by the payer.
- **Specialist capacity** — the chosen specialist's wait is too long.
- **Patient confirmation** — a booked appointment is never confirmed.
- **Closed-loop handoff** — the specialist's summary never reaches the PCP.

No single system owns the whole journey, so stalled referrals are discovered reactively,
risk information is fragmented, and follow-up depends on staff remembering to check.

## The value

- **Less manual reconciliation** — cross-system signals are monitored in one place.
- **Faster exception resolution** — blocked referrals are surfaced with the reason and
  a recommended next action.
- **Better closed-loop completion** — CareBridge keeps monitoring after scheduling and
  the specialist visit, so missing handoffs are not mistaken for completed referrals.

## Product boundaries

CareBridge is **NOT**:

- a diagnostic system
- a treatment-recommendation system
- a replacement for clinicians or for an EHR such as Epic
- an autonomous healthcare decision-maker

CareBridge manages **administrative and coordination workflows only**. Clinical
decisions remain with qualified healthcare professionals.

## Human-in-the-loop

CareBridge may detect, summarize, explain, recommend, prioritize, and prepare drafts.
A **human must explicitly approve** every consequential action — offering telehealth,
escalating an authorization, switching specialists, contacting a patient, requesting a
specialist note, and so on. Facts that arrive from external systems (for example, a
specialist summary being returned) update the observed state without a human decision,
but CareBridge never initiates a consequential action on its own.
