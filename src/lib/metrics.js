// Dashboard metric calculations (pure). Extracted unchanged from the Dashboard so the
// formulas can be unit-tested. Definitions are deliberately DIFFERENT things:
//  - activeReferrals: every referral except Closed
//  - atRisk ("Needs attention"): risk is not Low
//  - high ("Urgent"): risk is High
//  - onTrack: workflow status is exactly "On track" (a Low-risk Closed referral is NOT on track)
//  - actionsTaken: any approved action CareBridge initiated
//  - barriersResolved: the underlying problem is actually gone (includes closed loops)
//  - returnedOnTrack: resolved AND returned to an active on-track referral
//    (a referral that completed and closed, like Emily, is NOT "returned on track")
//  - loopsClosed: the referral loop fully closed
export function computeMetrics(patients) {
  const high = patients.filter((p) => p.risk === "High").length;
  const atRisk = patients.filter((p) => p.risk !== "Low").length;
  const activeReferrals = patients.filter((p) => p.workflowStatus !== "Closed").length;
  const onTrack = patients.filter((p) => p.workflowStatus === "On track").length;
  const actionsTaken = patients.filter((p) => p.actionTaken).length;
  const barriersResolved = patients.filter((p) => p.barrierResolved).length;
  const returnedOnTrack = patients.filter((p) => p.movedOnTrack && p.risk === "Low" && !p.loopClosed).length;
  const loopsClosed = patients.filter((p) => p.loopClosed).length;
  const stalledList = patients.filter((p) => p.stalledDays > 0).map((p) => p.stalledDays);
  const avgStalled = stalledList.length
    ? (stalledList.reduce((a, b) => a + b, 0) / stalledList.length).toFixed(1)
    : "0";

  return {
    high,
    atRisk,
    activeReferrals,
    onTrack,
    actionsTaken,
    barriersResolved,
    returnedOnTrack,
    loopsClosed,
    avgStalled,
  };
}
