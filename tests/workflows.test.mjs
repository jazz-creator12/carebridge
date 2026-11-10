// Regression tests for CareBridge's simulated workflows. Pure logic only (no DOM), run with:
//   npm test
import { test } from "node:test";
import assert from "node:assert/strict";

import { PATIENTS, JOURNEY_STEPS, ACTION_LABELS } from "../src/data/patients.js";
import { applyActionToPatient, applyExternalEvent, getActionProposal } from "../src/lib/actions.js";
import { computeMetrics } from "../src/lib/metrics.js";
import { orderJourneySteps } from "../src/lib/journey.js";
import { askCoordinator, getSuggestedQuestions } from "../src/lib/aiCoordinator.js";

const fresh = () => JSON.parse(JSON.stringify(PATIENTS));
const get = (ps, id) => ps.find((p) => p.id === id);
const act = (ps, id, type) => ps.map((p) => (p.id === id ? applyActionToPatient(p, type) : p));
const ext = (ps, id, type) => ps.map((p) => (p.id === id ? applyExternalEvent(p, type) : p));

function fullSession() {
  let ps = fresh();
  ps = act(ps, "sarah-miller", "offer_telehealth");
  ps = act(ps, "maria-lopez", "escalate_authorization");
  ps = act(ps, "david-chen", "offer_alternate_specialist");
  ps = act(ps, "robert-williams", "contact_patient");
  ps = act(ps, "emily-johnson", "request_specialist_note");
  ps = ext(ps, "emily-johnson", "specialist_note");
  return ps;
}

test("seed data: six fictional patients, starting metrics", () => {
  const ps = fresh();
  assert.equal(ps.length, 6);
  const m = computeMetrics(ps);
  assert.equal(m.activeReferrals, 6);
  assert.equal(m.atRisk, 5);
  assert.equal(m.high, 3);
  assert.equal(m.onTrack, 1);
  assert.equal(m.actionsTaken, 0);
});

test("every actionable patient exposes an approval proposal; none changes state until applied", () => {
  const ps = fresh();
  for (const id of ["sarah-miller", "maria-lopez", "david-chen", "robert-williams", "emily-johnson"]) {
    assert.ok(getActionProposal(get(ps, id)), `${id} has a proposal`);
  }
  assert.equal(getActionProposal(get(ps, "james-rodriguez")), null);
  // Building a proposal never mutates the patient.
  assert.deepEqual(ps, fresh());
});

test("Sarah: telehealth truly resolves access barrier", () => {
  const s = get(act(fresh(), "sarah-miller", "offer_telehealth"), "sarah-miller");
  assert.equal(s.risk, "Low");
  assert.equal(s.workflowStatus, "On track");
  assert.equal(s.barrierResolved, true);
  assert.equal(s.journey.appointment_scheduled, "done");
  assert.equal(s.journey.visit_completed, "pending");
  const slot = s.signals.find((x) => x.id === "telehealth-avail");
  assert.equal(slot.state, "historical");
  assert.equal(slot.fhir, "Slot");
  const appt = s.signals.find((x) => x.id === "telehealth-confirmed");
  assert.equal(appt.fhir, "Appointment");
  assert.equal(appt.state, "active");
});

test("Maria: escalation is an action, not a resolution", () => {
  const m = get(act(fresh(), "maria-lopez", "escalate_authorization"), "maria-lopez");
  assert.equal(m.risk, "High");
  assert.equal(m.workflowStatus, "Waiting on payer");
  assert.equal(m.actionTaken, true);
  assert.equal(m.barrierResolved, false);
  assert.equal(m.journey.insurance_cleared, "blocked");
  assert.equal(ACTION_LABELS[m.recommendedAction], "Monitor payer response");
  const esc = m.signals.find((x) => x.id === "auth-escalation");
  assert.match(esc.source, /CareBridge/);
  assert.equal(esc.fhir, undefined);
  assert.equal(m.signals.find((x) => x.id === "auth").source, "Payer API");
});

test("David: alternate specialist resolves capacity but does not book the appointment", () => {
  const d = get(act(fresh(), "david-chen", "offer_alternate_specialist"), "david-chen");
  assert.equal(d.risk, "Low");
  assert.equal(d.workflowStatus, "On track");
  assert.equal(d.journey.appointment_scheduled, "pending");
  assert.equal(d.journey.access_resolved, "done");
  assert.equal(d.journey.specialist_identified, "done");
});

test("Robert: simulated confirmation is clearly labeled", () => {
  const r = get(act(fresh(), "robert-williams", "contact_patient"), "robert-williams");
  assert.equal(r.risk, "Low");
  assert.equal(r.workflowStatus, "On track");
  assert.equal(r.journey.visit_completed, "pending");
  assert.match(r.lastAction, /Prototype simulation/);
});

test("Emily: note request is a CareBridge action; the note arrives as an external event", () => {
  let ps = act(fresh(), "emily-johnson", "request_specialist_note");
  const mid = get(ps, "emily-johnson");
  assert.equal(mid.risk, "Medium");
  assert.equal(mid.barrierResolved, false);
  assert.equal(mid.awaitingExternal, "specialist_note");
  const req = mid.signals.find((x) => x.id === "note-request");
  assert.match(req.source, /CareBridge/);
  assert.equal(req.fhir, undefined);

  ps = ext(ps, "emily-johnson", "specialist_note");
  const done = get(ps, "emily-johnson");
  assert.equal(done.workflowStatus, "Closed");
  assert.equal(done.risk, "Low");
  assert.equal(done.loopClosed, true);
  assert.equal(done.movedOnTrack, false);
  const received = done.signals.find((x) => x.id === "note-received");
  assert.equal(received.source, "Specialist EHR");
  assert.equal(received.fhir, "DocumentReference");
  assert.equal(done.journey.plan_returned, "done");
  assert.equal(done.journey.referral_closed, "done");
});

test("James: on track, no consequential action", () => {
  const j = get(fresh(), "james-rodriguez");
  assert.equal(j.risk, "Low");
  assert.equal(j.workflowStatus, "On track");
  assert.equal(j.recommendedAction, "none");
});

test("cumulative dashboard metrics after all five workflows", () => {
  const m = computeMetrics(fullSession());
  assert.deepEqual(
    {
      active: m.activeReferrals,
      needs: m.atRisk,
      urgent: m.high,
      onTrack: m.onTrack,
      actions: m.actionsTaken,
      resolved: m.barriersResolved,
      returned: m.returnedOnTrack,
      loops: m.loopsClosed,
      avg: m.avgStalled,
    },
    { active: 5, needs: 1, urgent: 1, onTrack: 4, actions: 5, resolved: 4, returned: 3, loops: 1, avg: "4.0" }
  );
});

test("administrative actions never count as resolved unless the barrier is resolved", () => {
  const ps = act(act(fresh(), "maria-lopez", "escalate_authorization"), "emily-johnson", "request_specialist_note");
  const m = computeMetrics(ps);
  assert.equal(m.actionsTaken, 2);
  assert.equal(m.barriersResolved, 0);
  assert.equal(m.returnedOnTrack, 0);
  assert.equal(m.loopsClosed, 0);
});

test("journey display order never shows a completed step below an unresolved one", () => {
  for (const p of fullSession().concat(fresh())) {
    const states = orderJourneySteps(p.journey, JOURNEY_STEPS).map((s) => p.journey[s.key]);
    let seenOpen = false;
    for (const s of states) {
      if (s !== "done") seenOpen = true;
      else assert.equal(seenOpen, false, `${p.name}: completed step after an open step`);
    }
    // Display ordering must not change stored statuses.
    assert.equal(Object.keys(p.journey).length, JOURNEY_STEPS.length);
  }
});

test("AI is state-aware for Maria and Emily", () => {
  const ps = fullSession();
  const priorities = askCoordinator("What are my top three priorities?", ps);
  const insurance = askCoordinator("Which referrals have insurance problems?", ps);
  assert.match(priorities, /Maria/);
  assert.match(insurance, /Maria/);
  assert.doesNotMatch(priorities + insurance, /No intervention needed/);
  const emily = askCoordinator("What should I do next for Emily?", ps);
  assert.match(emily, /loop is closed/i);
  assert.match(emily, /No further referral-coordination action is required/);
});

test("suggested chips do not contradict Sarah's state", () => {
  assert.ok(getSuggestedQuestions(fresh()).includes("Why is Sarah high risk?"));
  const after = getSuggestedQuestions(act(fresh(), "sarah-miller", "offer_telehealth"));
  assert.ok(!after.includes("Why is Sarah high risk?"));
  assert.ok(after.includes("Why is Sarah on track now?"));
});

test("filters: every card/chip bucket matches its dashboard count and relationships", async () => {
  const { filterReferrals, STATUS_TAB_KEYS, CHIP_KEYS, DEFAULT_FILTER } = await import("../src/lib/filters.js");
  const ps = fresh();
  const m = computeMetrics(ps);
  assert.equal(DEFAULT_FILTER, "ALL");
  assert.equal(filterReferrals(ps, "EVERYTHING").length, m.activeReferrals);
  assert.equal(filterReferrals(ps, "ALL").length, m.atRisk);
  assert.equal(filterReferrals(ps, "URGENT").length, m.high);
  assert.equal(filterReferrals(ps, "ON_TRACK").length, m.onTrack);
  assert.deepEqual(STATUS_TAB_KEYS, ["EVERYTHING", "ALL", "URGENT", "ON_TRACK"]);
  for (const key of CHIP_KEYS) assert.equal(filterReferrals(ps, key).length, 1, key);
  // Highest risk first.
  const order = filterReferrals(ps, "EVERYTHING").map((p) => p.risk);
  assert.deepEqual(order, [...order].sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a] - { High: 0, Medium: 1, Low: 2 }[b])));
  // After the full session a Closed referral leaves Active and is never On track.
  const done = fullSession();
  assert.equal(filterReferrals(done, "EVERYTHING").length, 5);
  assert.ok(!filterReferrals(done, "ON_TRACK").some((p) => p.id === "emily-johnson"));
  assert.deepEqual(filterReferrals(done, "ALL").map((p) => p.id), ["maria-lopez"]);
});
