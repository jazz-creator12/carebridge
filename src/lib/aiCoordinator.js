// A lightweight, rule-based "AI Referral Coordinator" acting as an operational assistant.
// It reads the app's LIVE patient state and helps with prioritization, synthesis,
// recommendations, and drafting. It gives NO medical diagnoses or treatment advice —
// only administrative, next-action guidance. All consequential actions still require
// human approval in the UI; the AI only recommends.

import { PATIENTS as SEED_PATIENTS, ACTION_LABELS } from "../data/patients.js";

const RISK_ORDER = { High: 0, Medium: 1, Low: 2 };

function findPatientInText(patients, text) {
  const t = text.toLowerCase();
  return patients.find((p) => {
    const first = p.name.split(" ")[0].toLowerCase();
    return t.includes(first) || t.includes(p.name.toLowerCase());
  });
}

function getById(patients, id) {
  return patients.find((p) => p.id === id);
}

function sortByRisk(list) {
  return [...list].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || b.stalledDays - a.stalledDays);
}

function needsAttentionAnswer(patients) {
  const flagged = sortByRisk(patients.filter((p) => p.risk !== "Low"));
  if (flagged.length === 0) {
    return "Good news — no referrals are currently at risk. Every active referral is on track.";
  }
  const lines = flagged.map((p) => {
    const tail = p.actionTaken
      ? `Action in progress (${p.workflowStatus}) — barrier still active.`
      : `Recommended: ${ACTION_LABELS[p.recommendedAction]}.`;
    return `• ${p.name} — ${p.specialty}, ${p.risk} risk, status ${p.workflowStatus}. ${p.barrier} (primary signal: ${p.blockingSystem}). ${tail}`;
  });
  return [`${flagged.length} referral${flagged.length === 1 ? "" : "s"} need attention today:`, ...lines].join("\n");
}

// Describe a patient's current action state from LIVE state (not just recommendedAction),
// so a referral with an action already in progress never reads "No intervention needed."
function actionPhrase(p) {
  if (p.actionTaken && !p.barrierResolved) {
    return `${p.lastAction || "action sent"} Still ${p.workflowStatus.toLowerCase()} — continue monitoring the response.`;
  }
  if (p.recommendedAction && p.recommendedAction !== "none") {
    return `Recommended: ${ACTION_LABELS[p.recommendedAction]}.`;
  }
  return "Continue monitoring.";
}

function topPrioritiesAnswer(patients) {
  const flagged = sortByRisk(patients.filter((p) => p.risk !== "Low")).slice(0, 3);
  if (flagged.length === 0) return "Nothing is at risk right now — all referrals are on track.";
  const lines = flagged.map((p, i) => `${i + 1}. ${p.name} (${p.specialty}, ${p.risk}, ${p.workflowStatus}) — ${actionPhrase(p)}`);
  return ["Your top priorities right now:", ...lines].join("\n");
}

function categoryAnswer(patients, categoryKey, label) {
  const matches = patients.filter((p) => p.category === categoryKey);
  if (matches.length === 0) return `No referrals are currently ${label}.`;
  const lines = matches.map((p) => `• ${p.name} — ${p.specialty}, ${p.workflowStatus}. ${p.barrier}. ${actionPhrase(p)}`);
  return [`Referrals ${label}:`, ...lines].join("\n");
}

function blockingSystemAnswer(patient) {
  if (patient.barrierResolved) {
    return `${patient.name}'s referral is no longer blocked. ${patient.summary}`;
  }
  if (patient.actionTaken) {
    return `${patient.name} is still blocked by the ${patient.blockingSystem} system, but an action is in progress — workflow status: "${patient.workflowStatus}". ${patient.summary}`;
  }
  return `${patient.name}'s referral is being blocked by the ${patient.blockingSystem} system. ${patient.summary} Recommended next action: ${ACTION_LABELS[patient.recommendedAction]} (requires your approval).`;
}

function blockingAnswer(patient) {
  if (patient.workflowStatus === "Closed" || patient.loopClosed) {
    return `${patient.name}'s referral is closed — nothing is blocking it. The specialist summary was received and routed to the PCP, so the loop is complete.`;
  }
  if (patient.barrierResolved) {
    if (patient.id === "sarah-miller") {
      return `Sarah's access barrier has been resolved through a telehealth appointment. Her referral is now on track (workflow status: On track). The next step is confirming completion of the specialist visit.`;
    }
    return `${patient.name}'s barrier is resolved — workflow status: "${patient.workflowStatus}". ${patient.summary}`;
  }
  if (patient.actionTaken) {
    return `${patient.name} is still ${patient.risk.toLowerCase()} risk and the barrier (${patient.blockingSystem}) is still active, even though an action has been taken. Workflow status: "${patient.workflowStatus}". ${patient.summary} Taking the action did not resolve the underlying problem — that only happens once the external response arrives.`;
  }
  const reasons = patient.riskReasons.map((r) => `• ${r}`).join("\n");
  return `${patient.name} is ${patient.risk.toLowerCase()} risk — CareBridge detected the barrier from the ${patient.blockingSystem} signal (workflow status: ${patient.workflowStatus}). Why:\n${reasons}\n\nRecommended next action: ${ACTION_LABELS[patient.recommendedAction]} (requires your approval).`;
}

function nextStepAnswer(patient) {
  if (patient) {
    if (patient.workflowStatus === "Closed" || patient.loopClosed) {
      return `${patient.name}'s referral loop is closed. The specialist summary was received and routed to the PCP. No further referral-coordination action is required.`;
    }
    if (patient.barrierResolved) {
      return `${patient.name} is on track. Next step: confirm the patient completes the specialist visit, then make sure the specialist information returns to the PCP (${patient.pcp}).`;
    }
    if (patient.actionTaken) {
      const follow = patient.recommendedAction !== "none" ? ` Once the response arrives you can approve "${ACTION_LABELS[patient.recommendedAction]}" to close it out.` : "";
      return `An action is already in progress for ${patient.name} (workflow status: "${patient.workflowStatus}"). The barrier stays active until the external response comes back, so the next step is to monitor and follow up.${follow}`;
    }
    return `Recommended next administrative action for ${patient.name}: ${ACTION_LABELS[patient.recommendedAction]}. Reason: ${patient.actionCenter?.evidence || patient.barrier}. This requires your approval before anything changes.`;
  }
  return "Start with the highest-risk referrals. Each at-risk patient has a recommended action on their page that you can review and approve.";
}

function draftMessageAnswer(patient, patients) {
  const p = patient || getById(patients, "sarah-miller");
  if (p.barrierResolved || p.risk === "Low") {
    return `Draft message to ${p.name}:\n\n"Hi ${p.name.split(" ")[0]}, good news — your ${p.specialty.toLowerCase()} referral is on track. We'll follow up with next steps shortly. Please reach out if you have any questions. We're here to help."`;
  }
  if (p.recommendedAction === "offer_telehealth") {
    return `Draft message to ${p.name}:\n\n"Hi ${p.name.split(" ")[0]}, this is the care team following up on your ${p.specialty.toLowerCase()} referral. We know travel can be difficult, so we'd like to offer a telehealth visit you can attend from home. Reply or call us and we'll get you scheduled."`;
  }
  if (p.recommendedAction === "contact_patient") {
    return `Draft message to ${p.name}:\n\n"Hi ${p.name.split(" ")[0]}, we have your ${p.specialty.toLowerCase()} appointment ready but haven't heard back. Please call or reply to confirm so we can hold your slot."`;
  }
  return `Draft message to ${p.name}:\n\n"Hi ${p.name.split(" ")[0]}, this is the care team following up on your ${p.specialty.toLowerCase()} referral. We're working to move things forward and will keep you updated. Please reach out with any questions."`;
}

function pcpSummaryAnswer(patient, patients) {
  const p = patient || getById(patients, "sarah-miller");
  const completed = Object.values(p.journey).filter((v) => v === "done").length;
  return `Summary for PCP (${p.pcp}):\n\nPatient: ${p.name} (age ${p.age})\nReferral: ${p.specialty}, placed ${p.referralDate}\nStatus: ${p.status}\nRisk: ${p.risk} — ${p.barrier}\nProgress: ${completed} of 8 journey steps complete. Appointment: ${p.appointmentStatus}.\nCoordination note: ${p.summary}`;
}

// Main entry point. Pass the CURRENT patients list so answers reflect live state.
export function askCoordinator(question, patients = SEED_PATIENTS) {
  const q = question.trim().toLowerCase();
  const patient = findPatientInText(patients, q);
  const sarah = getById(patients, "sarah-miller");

  if (/top (three|3)|priorit/.test(q)) return topPrioritiesAnswer(patients);
  if (/attention|today|queue|need.*action|who.*risk/.test(q)) return needsAttentionAnswer(patients);
  if (/insurance|authorization|payer|auth\b/.test(q)) return categoryAnswer(patients, "INSURANCE", "blocked by insurance");
  if (/access|transport|distance|travel|miles/.test(q)) return categoryAnswer(patients, "ACCESS", "with access barriers");
  if (/which system|what system|blocking .* system|system.*block/.test(q) && patient) return blockingSystemAnswer(patient);
  if (/block|stuck|why.*risk|what.*wrong|barrier|high risk/.test(q)) return blockingAnswer(patient || sarah);
  if (/draft|message|text|email|write.*to|reach out/.test(q)) return draftMessageAnswer(patient, patients);
  if (/summar|pcp|doctor|report/.test(q)) return pcpSummaryAnswer(patient, patients);
  if (/next|do|action|recommend|should i|what now/.test(q)) return nextStepAnswer(patient);

  if (patient) {
    return `${patient.name} — ${patient.specialty} referral, ${patient.risk} risk. ${patient.summary} Ask me "why is ${patient.name.split(" ")[0]} high risk?" or "what should I do next?"`;
  }

  return "I can help coordinate referrals. Try asking:\n• Which referrals need attention today?\n• What are my top three priorities?\n• Why is Sarah high risk?\n• Which system is blocking Maria?\n• Which referrals have insurance problems?\n• Which patients have access barriers?\n• Draft a message to Sarah.\n• Summarize Emily's case for her PCP.";
}

export const SUGGESTED_QUESTIONS = [
  "Which referrals need attention today?",
  "What are my top three priorities?",
  "Why is Sarah high risk?",
  "Which system is blocking Maria?",
  "Which referrals have insurance problems?",
  "Draft a message to Sarah.",
];
