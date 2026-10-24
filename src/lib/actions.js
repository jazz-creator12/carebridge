// Pure functions that transform a patient's referral state when a human-approved
// action is applied. These are SIMULATED workflow effects for the prototype —
// no real systems are contacted. Each returns a new patient object (never mutates).
//
// Key realism rule: taking an action is NOT the same as resolving the barrier.
//   - Some actions truly resolve the barrier (telehealth, alternate specialist,
//     patient confirmation) -> barrierResolved = true, patient moves On track.
//   - Some actions only start a process and leave the barrier active (escalate
//     authorization, request specialist note) -> actionTaken = true, but
//     barrierResolved stays false until a later simulated event arrives.

import { ACTION_LABELS } from "../data/patients.js";

// ---- signal helpers -------------------------------------------------------

// Replace a signal (matched by id) with new text/tone/state, keeping it in place.
function updateSignal(signals, id, patch) {
  return signals.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

// Append a brand-new signal to the end of the list.
function addSignal(signals, sig) {
  return [...signals, sig];
}

// ---- proposals shown in the approval modal --------------------------------

export function getActionProposal(patient) {
  switch (patient.recommendedAction) {
    case "offer_telehealth":
      return {
        type: "offer_telehealth",
        label: ACTION_LABELS.offer_telehealth,
        reason: `${patient.distanceMiles}-mile travel distance and no transportation.`,
        alternatives: ["Arrange transportation to the in-network specialist", "Contact the patient to discuss options"],
      };
    case "escalate_authorization":
      return {
        type: "escalate_authorization",
        label: ACTION_LABELS.escalate_authorization,
        reason: "Prior authorization is still pending with the payer and is blocking scheduling.",
        alternatives: ["Call the payer directly", "Request a peer-to-peer review"],
      };
    case "offer_alternate_specialist":
      return {
        type: "offer_alternate_specialist",
        label: ACTION_LABELS.offer_alternate_specialist,
        reason: `Current specialist wait is 11 weeks; an alternate is open in ${patient.alternateSpecialist?.waitDays} days.`,
        alternatives: ["Keep current specialist and add to a cancellation waitlist", "Check for a telehealth option"],
      };
    case "contact_patient":
      return {
        type: "contact_patient",
        label: ACTION_LABELS.contact_patient,
        reason: "The appointment is scheduled but unconfirmed after multiple outreach attempts.",
        alternatives: ["Send a text reminder", "Try an alternate phone number"],
      };
    case "request_specialist_note":
      return {
        type: "request_specialist_note",
        label: ACTION_LABELS.request_specialist_note,
        reason: "The visit is complete but the specialist summary has not reached the PCP.",
        alternatives: ["Fax a records request", "Call the specialist office directly"],
      };
    default:
      return null;
  }
}

// ---- action transforms ----------------------------------------------------

export function applyActionToPatient(patient, actionType) {
  switch (actionType) {
    // SARAH — telehealth truly resolves the access/transport barrier.
    case "offer_telehealth": {
      let signals = patient.signals;
      // Old "no appointment" signal is superseded by a scheduled telehealth visit.
      signals = updateSignal(signals, "scheduling", {
        text: "Telehealth appointment scheduled for Tuesday at 2:30 PM.",
        tone: "good",
        state: "resolved",
      });
      // Transportation problem is superseded because travel is no longer required.
      signals = updateSignal(signals, "transport", {
        text: "Transportation barrier no longer blocks care — telehealth was selected.",
        tone: "good",
        state: "resolved",
      });
      // The 74-mile distance is still TRUE, so it stays — but as historical context,
      // no longer an active blocker.
      signals = updateSignal(signals, "geography", {
        text: "Nearest in-person specialist is 74 miles away (no longer an active blocker — telehealth selected).",
        tone: "neutral",
        state: "historical",
      });
      signals = addSignal(signals, {
        id: "telehealth-confirmed",
        system: "TELEHEALTH",
        source: "Telehealth Scheduling",
        fhir: "Appointment",
        text: "Telehealth visit confirmed. Travel barrier removed.",
        tone: "good",
        state: "active",
      });

      return {
        ...patient,
        risk: "Low",
        workflowStatus: "On track",
        barrier: "None (telehealth resolves travel)",
        barrierResolved: true,
        actionTaken: true,
        movedOnTrack: true,
        category: "ON_TRACK",
        blockingSystem: null,
        status: "Telehealth scheduled",
        appointmentStatus: "Telehealth scheduled",
        stalledDays: 0,
        recommendedAction: "none",
        summary: `Telehealth appointment scheduled for ${patient.specialty.toLowerCase()}, which removes the 74-mile travel and transportation barrier. Referral is on track.`,
        lastAction: "Telehealth offered and scheduled — access barrier resolved.",
        journey: { ...patient.journey, appointment_scheduled: "done", access_resolved: "done" },
        timelineNotes: {
          ...patient.timelineNotes,
          appointment_scheduled: "Telehealth appointment scheduled — no travel required.",
          access_resolved: "Resolved — telehealth means the patient attends from home.",
        },
        signals,
      };
    }

    // MARIA — escalation is an action, NOT a resolution. Barrier stays active.
    case "escalate_authorization": {
      let signals = patient.signals;
      // The authorization signal stays ACTIVE (still blocking) but notes escalation.
      signals = updateSignal(signals, "auth", {
        text: "Prior authorization still pending — escalation submitted, awaiting payer decision.",
        tone: "warn",
        state: "active",
      });
      signals = addSignal(signals, {
        id: "auth-escalation",
        system: "PAYER",
        source: "Payer API",
        text: "Authorization escalation sent to payer. Expedited review requested.",
        tone: "good",
        state: "active",
      });

      return {
        ...patient,
        // Risk stays elevated — the underlying blocker is unchanged.
        risk: "High",
        workflowStatus: "Waiting on payer",
        barrier: "Prior authorization pending (escalation sent)",
        barrierResolved: false, // NOT resolved
        actionTaken: true,
        movedOnTrack: false,
        category: "INSURANCE", // still an insurance block
        blockingSystem: "Payer API",
        status: "Authorization escalation sent — awaiting payer",
        appointmentStatus: "On hold (authorization still pending)",
        recommendedAction: "none",
        lastAction: "Authorization escalation sent to payer. Barrier remains active until the payer approves.",
        summary: `Authorization escalation sent to ${patient.insurance}. The prior-authorization barrier is still active and the appointment cannot be booked until the payer approves.`,
        timelineNotes: {
          ...patient.timelineNotes,
          insurance_cleared: "Escalation sent — still blocked, waiting on the payer's decision.",
        },
        signals,
      };
    }

    // DAVID — alternate specialist truly resolves the capacity barrier.
    case "offer_alternate_specialist": {
      const alt = patient.alternateSpecialist || { name: "Alternate specialist", waitDays: 12 };
      let signals = patient.signals;
      signals = updateSignal(signals, "capacity", {
        text: "Original specialist (11-week wait) no longer selected.",
        tone: "neutral",
        state: "historical",
      });
      signals = updateSignal(signals, "alternate", {
        text: `${alt.name} selected — appointment available in ${alt.waitDays} days.`,
        tone: "good",
        state: "resolved",
      });

      return {
        ...patient,
        risk: "Low",
        workflowStatus: "On track",
        barrier: `None (alternate specialist, ${alt.waitDays}-day wait)`,
        barrierResolved: true,
        actionTaken: true,
        movedOnTrack: true,
        category: "ON_TRACK",
        blockingSystem: null,
        status: `Alternate specialist selected (${alt.waitDays}-day wait)`,
        appointmentStatus: `Scheduling with ${alt.name} (~${alt.waitDays} days)`,
        stalledDays: 0,
        recommendedAction: "none",
        currentSpecialist: { name: alt.name, waitWeeks: Math.round(alt.waitDays / 7) },
        lastAction: `Switched to alternate specialist ${alt.name} — capacity barrier resolved.`,
        summary: `Switched to in-network alternate ${alt.name}, cutting the wait from 11 weeks to ${alt.waitDays} days. Scheduling can proceed.`,
        journey: { ...patient.journey, appointment_scheduled: "done" },
        timelineNotes: {
          ...patient.timelineNotes,
          specialist_identified: `Alternate specialist ${alt.name} selected.`,
          appointment_scheduled: `Scheduling with ${alt.name} — about ${alt.waitDays} days out.`,
        },
        signals,
      };
    }

    // ROBERT — patient confirmation truly resolves the engagement barrier.
    case "contact_patient": {
      let signals = patient.signals;
      signals = updateSignal(signals, "outreach", {
        text: "Patient reached and appointment confirmed.",
        tone: "good",
        state: "resolved",
      });

      return {
        ...patient,
        risk: "Low",
        workflowStatus: "On track",
        barrier: "None (appointment confirmed)",
        barrierResolved: true,
        actionTaken: true,
        movedOnTrack: true,
        category: "ON_TRACK",
        blockingSystem: null,
        status: "Appointment confirmed by patient",
        appointmentStatus: "Scheduled — confirmed",
        stalledDays: 0,
        recommendedAction: "none",
        lastAction: "Patient contacted and appointment confirmed — engagement barrier resolved.",
        summary: "The patient confirmed the scheduled appointment after outreach. Referral is on track.",
        journey: { ...patient.journey, access_resolved: "done" },
        timelineNotes: {
          ...patient.timelineNotes,
          access_resolved: "Resolved — patient reached and appointment confirmed.",
          visit_completed: "On track for the confirmed appointment.",
        },
        signals,
      };
    }

    // EMILY step 1 — requesting the note is an ACTION, not a resolution.
    case "request_specialist_note": {
      let signals = patient.signals;
      // The "no summary" signal stays ACTIVE (loop still open) but notes the request.
      signals = updateSignal(signals, "note", {
        text: "Specialist summary still not received — records request sent, awaiting response.",
        tone: "warn",
        state: "active",
      });
      signals = addSignal(signals, {
        id: "note-request",
        system: "CAREBRIDGE",
        source: "CareBridge / Coordinator action",
        // No FHIR resource: this is a CareBridge-initiated action, not an external record.
        text: "Specialist note requested. Routing to PCP will begin once the note is received.",
        tone: "good",
        state: "active",
      });

      return {
        ...patient,
        risk: "Medium", // unchanged — loop still open
        workflowStatus: "Waiting on specialist",
        barrier: "Closed-loop communication failure (note requested)",
        barrierResolved: false, // NOT resolved yet
        actionTaken: true,
        movedOnTrack: false,
        category: "CLOSED_LOOP",
        blockingSystem: "Specialist EHR",
        status: "Specialist note requested — awaiting response",
        appointmentStatus: "Visit completed",
        recommendedAction: "none", // no further human action — the note arrives from an external system
        awaitingExternal: "specialist_note", // enables the "simulate incoming note" demo control
        lastAction: "Specialist note requested. The loop stays open until the specialist system returns the note.",
        summary: "Requested the specialist summary. The referral loop is still open and will close once the note is received and routed to the PCP.",
        timelineNotes: {
          ...patient.timelineNotes,
          plan_returned: "Requested — awaiting the specialist note. Loop still open.",
        },
        signals,
      };
    }

    default:
      return patient;
  }
}

// ---- external system events (NO human approval) ---------------------------
// These model facts arriving from another system. CareBridge observes the signal
// and updates its workflow state. There is no approval modal for these.
export function applyExternalEvent(patient, eventType) {
  switch (eventType) {
    // EMILY — the specialist system returns the visit summary. This is an external
    // event, not a coordinator decision, so it closes the loop without approval.
    case "specialist_note": {
      let signals = patient.signals;
      // The incoming fact from the specialist system (the actual external record).
      signals = addSignal(signals, {
        id: "note-received",
        system: "SPECIALIST_EHR",
        source: "Specialist EHR",
        fhir: "DocumentReference",
        text: "Specialist visit summary received and routed to PCP — simulated external event.",
        tone: "good",
        state: "active",
      });
      // The missing-note barrier is now resolved.
      signals = updateSignal(signals, "note", {
        text: "Specialist summary received — barrier resolved.",
        tone: "good",
        state: "resolved",
      });
      // The CareBridge note request has been fulfilled.
      signals = updateSignal(signals, "note-request", {
        text: "Records request fulfilled — summary delivered to the PCP.",
        tone: "good",
        state: "resolved",
      });
      // PCP information handoff confirmed; loop closed.
      signals = addSignal(signals, {
        id: "loop-closed",
        system: "PCP_EHR",
        source: "Primary Care EHR",
        fhir: "ServiceRequest",
        text: "PCP handoff confirmed. Referral marked completed and closed.",
        tone: "good",
        state: "active",
      });

      return {
        ...patient,
        risk: "Low",
        workflowStatus: "Closed",
        barrier: "None (loop closed)",
        barrierResolved: true, // NOW truly resolved
        loopClosed: true, // a completed/closed referral (not a "returned on track" one)
        movedOnTrack: false, // Emily completed & closed — she did not return to an active state
        awaitingExternal: null,
        category: "ON_TRACK",
        blockingSystem: null,
        status: "Specialist note received — referral closed",
        appointmentStatus: "Visit completed",
        stalledDays: 0,
        recommendedAction: "none",
        lastAction: "Specialist summary received and routed to PCP — simulated external event. CareBridge confirmed the handoff and closed the loop.",
        summary: "The specialist summary was received from the Specialist EHR and routed to the PCP. The handoff is confirmed and the referral loop is closed.",
        journey: { ...patient.journey, plan_returned: "done", referral_closed: "done" },
        timelineNotes: {
          ...patient.timelineNotes,
          plan_returned: "Completed — specialist note received and routed to the PCP.",
          referral_closed: "Closed — the loop is complete.",
        },
        signals,
      };
    }

    default:
      return patient;
  }
}
