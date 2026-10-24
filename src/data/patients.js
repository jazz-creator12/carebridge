// CareBridge mock data.
// Everything here is entirely fictional. No real patients, no PHI, no real integrations.
// CareBridge simulates receiving signals from several disconnected healthcare systems
// and combines them into one referral journey. All "integrations" below are SIMULATED
// for this hackathon prototype.
//
// This single file powers the dashboard, the patient journey, the connected-signals
// view, the risk explanations, the action center, and the AI coordinator.

// The eight canonical steps of a referral journey. CareBridge monitors whether each
// step actually happens across the different systems.
export const JOURNEY_STEPS = [
  { key: "referral_placed", label: "Referral placed" },
  { key: "insurance_cleared", label: "Insurance cleared" },
  { key: "specialist_identified", label: "Specialist identified" },
  { key: "appointment_scheduled", label: "Appointment scheduled" },
  { key: "access_resolved", label: "Access barrier resolved" },
  { key: "visit_completed", label: "Visit completed" },
  { key: "plan_returned", label: "Specialist information returned to PCP" },
  { key: "referral_closed", label: "Referral closed" },
];

// Operational categories used to bucket referrals on the dashboard.
export const CATEGORIES = {
  ACCESS: "Blocked by access",
  INSURANCE: "Blocked by insurance",
  SPECIALIST: "Waiting on specialist",
  PATIENT: "Waiting on patient",
  CLOSED_LOOP: "Closed-loop gap",
  ON_TRACK: "On track",
};

// Workflow status is SEPARATE from risk. Risk is how worrying the referral is;
// workflow status is where the referral sits operationally. Taking an action can
// change the workflow status (e.g. "Action in progress") without resolving the
// underlying barrier or lowering risk.
export const WORKFLOW = {
  BLOCKED: "Blocked",
  NEEDS_ACTION: "Needs action",
  IN_PROGRESS: "Action in progress",
  WAITING_EXTERNAL: "Waiting on external response",
  MONITORING: "Monitoring",
  ON_TRACK: "On track",
  CLOSED: "Closed",
};

// Visual tone for each workflow status pill.
export const WORKFLOW_TONE = {
  Blocked: "red",
  "Needs action": "red",
  "Action in progress": "blue",
  "Waiting on payer": "amber",
  "Waiting on specialist": "amber",
  "Waiting on external response": "amber",
  Monitoring: "amber",
  "On track": "green",
  Closed: "green",
};

// Signal lifecycle states, used to show whether a signal is a current problem,
// something that's been cleared, or a past event kept for the audit trail.
export const SIGNAL_STATE = {
  ACTIVE: "active",
  RESOLVED: "resolved",
  HISTORICAL: "historical",
};

// FHIR-aligned resource types for the signals that map to standard healthcare
// interoperability records. This is a SIMULATED, FHIR-aligned prototype — not a
// certified or live FHIR integration. Operational/contextual signals (geography,
// transportation, patient-reported access) intentionally have NO FHIR resource.
export const FHIR_RESOURCES = {
  SERVICE_REQUEST: "ServiceRequest", // referral placed (Primary Care EHR)
  SLOT: "Slot", // an available appointment time (not yet booked)
  APPOINTMENT: "Appointment", // an appointment that is actually booked/scheduled
  COVERAGE_ELIGIBILITY: "CoverageEligibilityResponse", // payer coverage / prior auth
  DOCUMENT_REFERENCE: "DocumentReference", // specialist visit summary / clinical note
};

// The architecture map shown in the "How CareBridge connects systems" explainer.
export const FHIR_ARCHITECTURE = [
  { system: "Primary Care EHR", resource: "ServiceRequest" },
  { system: "Payer", resource: "CoverageEligibilityResponse" },
  { system: "Scheduling / Telehealth", resource: "Appointment" },
  { system: "Specialist EHR", resource: "DocumentReference" },
];

// The mock source systems that feed signals into CareBridge.
export const SOURCE_SYSTEMS = {
  PCP_EHR: "Primary Care EHR",
  PAYER: "Payer API",
  SCHEDULING: "Specialist Scheduling",
  GEOGRAPHY: "Access / Geography",
  TRANSPORT: "Transportation",
  TELEHEALTH: "Telehealth Scheduling",
  SPECIALIST_EHR: "Specialist EHR",
  INTAKE: "Patient Intake",
  OUTREACH: "Patient Outreach",
};

export const PATIENTS = [
  {
    id: "sarah-miller",
    name: "Sarah Miller",
    age: 58,
    specialty: "Cardiology",
    referralDaysAgo: 6,
    referralDate: "6 days ago",
    stalledDays: 6,
    status: "No appointment scheduled",
    appointmentStatus: "Not scheduled",
    risk: "High",
    workflowStatus: "Blocked",
    barrier: "No transportation (74 miles)",
    category: "ACCESS",
    blockingSystem: "Transportation",
    pcp: "Dr. Alan Weber",
    phone: "(555) 014-2290",
    insurance: "BlueRidge HMO",
    distanceMiles: 74,
    telehealthAvailable: true,
    recommendedAction: "offer_telehealth",
    summary:
      "Referred to cardiology 6 days ago. No appointment has been scheduled. Nearest in-network cardiologist is 74 miles away and the patient reports no transportation. A telehealth option is available.",
    journey: {
      referral_placed: "done",
      insurance_cleared: "done",
      specialist_identified: "done",
      appointment_scheduled: "blocked",
      access_resolved: "blocked",
      visit_completed: "pending",
      plan_returned: "pending",
      referral_closed: "pending",
    },
    timelineNotes: {
      referral_placed: "PCP Dr. Weber placed a cardiology referral.",
      insurance_cleared: "BlueRidge HMO confirmed in-network, no authorization required.",
      specialist_identified: "Nearest in-network cardiologist located 74 miles away.",
      appointment_scheduled: "Blocked — no appointment booked after 6 days. Patient unable to travel 74 miles.",
      access_resolved: "Blocked — patient has no transportation. Telehealth is available as an alternative.",
      visit_completed: "Waiting on a scheduled appointment.",
      plan_returned: "Waiting on a completed visit.",
      referral_closed: "Waiting on the loop to close.",
    },
    signals: [
      { id: "referral", system: "PCP_EHR", source: "Primary Care EHR", fhir: "ServiceRequest", text: "Cardiology referral placed 6 days ago.", tone: "neutral", state: "active" },
      { id: "insurance", system: "PAYER", source: "Payer API", fhir: "CoverageEligibilityResponse", text: "Specialist is in-network. Authorization not required.", tone: "good", state: "active" },
      { id: "scheduling", system: "SCHEDULING", source: "Specialist Scheduling", fhir: "Appointment", text: "No appointment scheduled.", tone: "bad", state: "active" },
      { id: "geography", system: "GEOGRAPHY", source: "Access / Geography", text: "Nearest in-network specialist: 74 miles away.", tone: "warn", state: "active" },
      { id: "transport", system: "TRANSPORT", source: "Patient Intake", text: "Patient reports no reliable transportation.", tone: "bad", state: "active" },
      { id: "telehealth-avail", system: "TELEHEALTH", source: "Telehealth Scheduling", fhir: "Slot", text: "Virtual cardiology appointment available Tuesday at 2:30 PM.", tone: "good", state: "active" },
    ],
    riskReasons: [
      "No appointment after 6 days",
      "74-mile travel distance",
      "No reliable transportation",
      "Telehealth option available",
    ],
    actionCenter: {
      problem: "Patient cannot realistically reach the specialist.",
      evidence: "74-mile distance + no transportation + no appointment after 6 days.",
      action: "Offer telehealth appointment.",
      effect: "Removes the travel barrier and allows scheduling to proceed.",
    },
  },

  {
    id: "maria-lopez",
    name: "Maria Lopez",
    age: 63,
    specialty: "Neurology",
    referralDaysAgo: 4,
    referralDate: "4 days ago",
    stalledDays: 4,
    status: "Waiting for insurance authorization",
    appointmentStatus: "On hold (pending authorization)",
    risk: "High",
    workflowStatus: "Blocked",
    barrier: "Prior authorization pending",
    category: "INSURANCE",
    blockingSystem: "Payer API",
    pcp: "Dr. Priya Nair",
    phone: "(555) 041-6677",
    insurance: "BlueRidge HMO",
    distanceMiles: 38,
    telehealthAvailable: false,
    recommendedAction: "escalate_authorization",
    summary:
      "Referred to neurology 4 days ago. A specialist is selected but the appointment cannot proceed because prior authorization is still pending with the payer.",
    journey: {
      referral_placed: "done",
      insurance_cleared: "blocked",
      specialist_identified: "done",
      appointment_scheduled: "pending",
      access_resolved: "pending",
      visit_completed: "pending",
      plan_returned: "pending",
      referral_closed: "pending",
    },
    timelineNotes: {
      referral_placed: "PCP Dr. Nair placed a neurology referral.",
      insurance_cleared: "Blocked — BlueRidge HMO requires prior authorization. Request submitted, awaiting decision.",
      specialist_identified: "In-network neurologist located 38 miles away.",
      appointment_scheduled: "Cannot book until authorization clears.",
      access_resolved: "Not yet needed.",
      visit_completed: "Waiting on a scheduled appointment.",
      plan_returned: "Waiting on a completed visit.",
      referral_closed: "Waiting on the loop to close.",
    },
    signals: [
      { id: "referral", system: "PCP_EHR", source: "Primary Care EHR", fhir: "ServiceRequest", text: "Neurology referral placed 4 days ago.", tone: "neutral", state: "active" },
      { id: "scheduling", system: "SCHEDULING", source: "Specialist Scheduling", fhir: "Appointment", text: "In-network neurologist selected.", tone: "good", state: "active" },
      { id: "auth", system: "PAYER", source: "Payer API", fhir: "CoverageEligibilityResponse", text: "Prior authorization required and still pending.", tone: "bad", state: "active" },
      { id: "geography", system: "GEOGRAPHY", source: "Access / Geography", text: "Specialist is 38 miles away.", tone: "neutral", state: "active" },
    ],
    riskReasons: [
      "Prior authorization unresolved",
      "Referral cannot progress until payer responds",
      "4 days since referral with no movement",
    ],
    actionCenter: {
      problem: "Referral is stalled at the payer.",
      evidence: "Prior authorization required, submitted, and still pending after 4 days.",
      action: "Escalate the authorization follow-up with the payer.",
      effect: "Pushes the payer for a decision so scheduling can begin.",
    },
  },

  {
    id: "david-chen",
    name: "David Chen",
    age: 47,
    specialty: "Orthopedics",
    referralDaysAgo: 8,
    referralDate: "8 days ago",
    stalledDays: 8,
    status: "Specialist has no availability for 11 weeks",
    appointmentStatus: "Long wait (11 weeks)",
    risk: "High",
    workflowStatus: "Blocked",
    barrier: "Specialist capacity (11-week wait)",
    category: "SPECIALIST",
    blockingSystem: "Specialist Scheduling",
    pcp: "Dr. Alan Weber",
    phone: "(555) 088-3301",
    insurance: "StatePlan PPO",
    distanceMiles: 22,
    telehealthAvailable: false,
    recommendedAction: "offer_alternate_specialist",
    alternateSpecialist: { name: "Dr. Owens (Riverbend Ortho)", waitDays: 12 },
    currentSpecialist: { name: "Dr. Patel (Metro Ortho)", waitWeeks: 11 },
    summary:
      "Referred to orthopedics 8 days ago. The selected specialist has no appointment for 11 weeks. Another in-network specialist has availability in 12 days.",
    journey: {
      referral_placed: "done",
      insurance_cleared: "done",
      specialist_identified: "done",
      appointment_scheduled: "blocked",
      access_resolved: "pending",
      visit_completed: "pending",
      plan_returned: "pending",
      referral_closed: "pending",
    },
    timelineNotes: {
      referral_placed: "PCP Dr. Weber placed an orthopedics referral.",
      insurance_cleared: "StatePlan PPO confirmed in-network.",
      specialist_identified: "Dr. Patel (Metro Ortho) selected — 22 miles away.",
      appointment_scheduled: "Blocked — Dr. Patel's next opening is 11 weeks out.",
      access_resolved: "Not yet needed.",
      visit_completed: "Waiting on a scheduled appointment.",
      plan_returned: "Waiting on a completed visit.",
      referral_closed: "Waiting on the loop to close.",
    },
    signals: [
      { id: "referral", system: "PCP_EHR", source: "Primary Care EHR", fhir: "ServiceRequest", text: "Orthopedics referral placed 8 days ago.", tone: "neutral", state: "active" },
      { id: "insurance", system: "PAYER", source: "Payer API", fhir: "CoverageEligibilityResponse", text: "In-network, no authorization required.", tone: "good", state: "active" },
      { id: "capacity", system: "SCHEDULING", source: "Specialist Scheduling", fhir: "Slot", text: "Dr. Patel (Metro Ortho): next opening in 11 weeks.", tone: "bad", state: "active" },
      { id: "alternate", system: "SCHEDULING", source: "Specialist Scheduling", fhir: "Slot", text: "Alternate: Dr. Owens (Riverbend Ortho) available in 12 days.", tone: "good", state: "active" },
    ],
    riskReasons: [
      "Current specialist wait is 11 weeks",
      "Condition shouldn't wait that long administratively",
      "An in-network alternate is available in 12 days",
    ],
    actionCenter: {
      problem: "The chosen specialist cannot see the patient for 11 weeks.",
      evidence: "Dr. Patel's next opening is 11 weeks out; Dr. Owens is open in 12 days.",
      action: "Offer the alternate in-network specialist.",
      effect: "Cuts the wait from 11 weeks to 12 days and unblocks scheduling.",
    },
  },

  {
    id: "robert-williams",
    name: "Robert Williams",
    age: 54,
    specialty: "Gastroenterology",
    referralDaysAgo: 5,
    referralDate: "5 days ago",
    stalledDays: 3,
    status: "Appointment unconfirmed by patient",
    appointmentStatus: "Scheduled — unconfirmed",
    risk: "Medium",
    workflowStatus: "Needs action",
    barrier: "Patient has not confirmed",
    category: "PATIENT",
    blockingSystem: "Patient Outreach",
    pcp: "Dr. Priya Nair",
    phone: "(555) 072-5519",
    insurance: "StatePlan PPO",
    distanceMiles: 15,
    telehealthAvailable: false,
    recommendedAction: "contact_patient",
    summary:
      "Referred to gastroenterology 5 days ago. An appointment is scheduled, but the patient has not confirmed after multiple outreach attempts.",
    journey: {
      referral_placed: "done",
      insurance_cleared: "done",
      specialist_identified: "done",
      appointment_scheduled: "done",
      access_resolved: "blocked",
      visit_completed: "pending",
      plan_returned: "pending",
      referral_closed: "pending",
    },
    timelineNotes: {
      referral_placed: "PCP Dr. Nair placed a gastroenterology referral.",
      insurance_cleared: "StatePlan PPO confirmed in-network.",
      specialist_identified: "In-network GI specialist selected — 15 miles away.",
      appointment_scheduled: "Appointment booked for next Wednesday.",
      access_resolved: "Blocked — patient has not confirmed after 3 outreach attempts.",
      visit_completed: "At risk — unconfirmed appointments are often missed.",
      plan_returned: "Waiting on a completed visit.",
      referral_closed: "Waiting on the loop to close.",
    },
    signals: [
      { id: "referral", system: "PCP_EHR", source: "Primary Care EHR", fhir: "ServiceRequest", text: "Gastroenterology referral placed 5 days ago.", tone: "neutral", state: "active" },
      { id: "scheduling", system: "SCHEDULING", source: "Specialist Scheduling", fhir: "Appointment", text: "Appointment booked for next Wednesday.", tone: "good", state: "active" },
      { id: "outreach", system: "OUTREACH", source: "Patient Outreach", text: "3 outreach attempts, no confirmation from patient.", tone: "bad", state: "active" },
    ],
    riskReasons: [
      "Appointment scheduled but unconfirmed",
      "3 outreach attempts with no response",
      "Unconfirmed appointments are frequently missed",
    ],
    actionCenter: {
      problem: "The patient has not confirmed a scheduled appointment.",
      evidence: "Appointment booked, but 3 outreach attempts went unanswered.",
      action: "Contact the patient to confirm the appointment.",
      effect: "Reduces the chance of a no-show and keeps the visit on track.",
    },
  },

  {
    id: "emily-johnson",
    name: "Emily Johnson",
    age: 39,
    specialty: "Endocrinology",
    referralDaysAgo: 21,
    referralDate: "21 days ago",
    stalledDays: 7,
    status: "Specialist summary not received by PCP",
    appointmentStatus: "Visit completed",
    risk: "Medium",
    workflowStatus: "Waiting on specialist",
    barrier: "Closed-loop communication failure",
    category: "CLOSED_LOOP",
    blockingSystem: "Specialist EHR",
    pcp: "Dr. Alan Weber",
    phone: "(555) 063-8842",
    insurance: "BlueRidge HMO",
    distanceMiles: 29,
    telehealthAvailable: false,
    recommendedAction: "request_specialist_note",
    summary:
      "Endocrinology visit was completed, but the primary-care team has not received the specialist summary. The referral loop has not closed.",
    journey: {
      referral_placed: "done",
      insurance_cleared: "done",
      specialist_identified: "done",
      appointment_scheduled: "done",
      access_resolved: "done",
      visit_completed: "done",
      plan_returned: "blocked",
      referral_closed: "pending",
    },
    timelineNotes: {
      referral_placed: "PCP Dr. Weber placed an endocrinology referral.",
      insurance_cleared: "BlueRidge HMO confirmed in-network.",
      specialist_identified: "In-network endocrinologist selected — 29 miles away.",
      appointment_scheduled: "Appointment booked and attended.",
      access_resolved: "No access barrier.",
      visit_completed: "Specialist visit completed 7 days ago.",
      plan_returned: "Blocked — specialist summary has not been returned to the PCP.",
      referral_closed: "Cannot close until the PCP receives the summary.",
    },
    signals: [
      { id: "referral", system: "PCP_EHR", source: "Primary Care EHR", fhir: "ServiceRequest", text: "Endocrinology referral placed 21 days ago.", tone: "neutral", state: "active" },
      { id: "appt", system: "SCHEDULING", source: "Specialist Scheduling", fhir: "Appointment", text: "Appointment attended.", tone: "good", state: "active" },
      { id: "visit", system: "SPECIALIST_EHR", source: "Specialist EHR", text: "Visit completed 7 days ago.", tone: "good", state: "active" },
      { id: "note", system: "SPECIALIST_EHR", source: "Specialist EHR", text: "No visit summary returned to the referring PCP.", tone: "bad", state: "active" },
    ],
    riskReasons: [
      "Visit completed but summary not received",
      "Referral loop open for 7 days post-visit",
      "PCP cannot act without the specialist note",
    ],
    actionCenter: {
      problem: "The referral loop is open — the PCP never got the specialist's summary.",
      evidence: "Visit completed 7 days ago; no note has been returned to the PCP.",
      action: "Request the specialist note and route it to the PCP.",
      effect: "Closes the loop so the PCP can continue the patient's care.",
    },
  },

  {
    id: "james-rodriguez",
    name: "James Rodriguez",
    age: 41,
    specialty: "Dermatology",
    referralDaysAgo: 3,
    referralDate: "3 days ago",
    stalledDays: 0,
    status: "Telehealth appointment scheduled",
    appointmentStatus: "Scheduled (Telehealth, Thu 2:30 PM)",
    risk: "Low",
    workflowStatus: "On track",
    barrier: "None",
    category: "ON_TRACK",
    blockingSystem: null,
    pcp: "Dr. Alan Weber",
    phone: "(555) 027-8841",
    insurance: "StatePlan PPO",
    distanceMiles: 0,
    telehealthAvailable: true,
    recommendedAction: "none",
    summary:
      "Referred to dermatology 3 days ago. A telehealth appointment is already scheduled. No unresolved barriers. On track.",
    journey: {
      referral_placed: "done",
      insurance_cleared: "done",
      specialist_identified: "done",
      appointment_scheduled: "done",
      access_resolved: "done",
      visit_completed: "pending",
      plan_returned: "pending",
      referral_closed: "pending",
    },
    timelineNotes: {
      referral_placed: "PCP Dr. Weber placed a dermatology referral.",
      insurance_cleared: "StatePlan PPO confirmed in-network.",
      specialist_identified: "In-network teledermatology provider matched.",
      appointment_scheduled: "Telehealth appointment booked for Thursday 2:30 PM.",
      access_resolved: "Telehealth — no travel required.",
      visit_completed: "Upcoming appointment on Thursday.",
      plan_returned: "Waiting on a completed visit.",
      referral_closed: "Waiting on the loop to close.",
    },
    signals: [
      { id: "referral", system: "PCP_EHR", source: "Primary Care EHR", fhir: "ServiceRequest", text: "Dermatology referral placed 3 days ago.", tone: "neutral", state: "active" },
      { id: "insurance", system: "PAYER", source: "Payer API", fhir: "CoverageEligibilityResponse", text: "In-network, no authorization required.", tone: "good", state: "active" },
      { id: "telehealth", system: "TELEHEALTH", source: "Telehealth Scheduling", fhir: "Appointment", text: "Telehealth appointment booked for Thursday 2:30 PM.", tone: "good", state: "active" },
    ],
    riskReasons: [
      "Appointment scheduled",
      "No access, insurance, or capacity barriers",
      "Telehealth removes any travel concern",
    ],
    actionCenter: null,
  },
];

export function getPatient(list, id) {
  return (list || PATIENTS).find((p) => p.id === id);
}

// A human-readable label for each recommended action.
export const ACTION_LABELS = {
  offer_telehealth: "Offer telehealth",
  escalate_authorization: "Escalate authorization follow-up",
  offer_alternate_specialist: "Offer alternate specialist",
  contact_patient: "Contact patient / confirm appointment",
  request_specialist_note: "Request specialist note",
  none: "No intervention needed",
};
