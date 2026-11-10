// DISPLAY-ONLY ordering for the vertical referral journey: Completed (done) steps first
// in canonical order, then the remaining (blocked/pending) steps in canonical order.
// This stops a later Completed step from appearing below an earlier unresolved
// prerequisite. It reads the journey map but never changes it.
export function orderJourneySteps(journey, steps) {
  const done = steps.filter((s) => journey[s.key] === "done");
  const other = steps.filter((s) => journey[s.key] !== "done");
  return [...done, ...other];
}
