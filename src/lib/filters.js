// Referral filter buckets (pure). Same definitions the dashboard has always used.
// The four status tabs drive EVERYTHING / ALL / URGENT / ON_TRACK; the barrier-type
// chips drive the category buckets. Everything shares one `filter` key.
export const RISK_ORDER = { High: 0, Medium: 1, Low: 2 };

export const BUCKETS = [
  { key: "EVERYTHING", label: "Active referrals", match: (p) => p.workflowStatus !== "Closed" },
  { key: "ALL", label: "Needs attention now", match: (p) => p.risk !== "Low" },
  { key: "URGENT", label: "Urgent", match: (p) => p.risk === "High" },
  { key: "INSURANCE", label: "Blocked by insurance", match: (p) => p.category === "INSURANCE" },
  { key: "ACCESS", label: "Blocked by access", match: (p) => p.category === "ACCESS" },
  { key: "PATIENT", label: "Waiting on patient", match: (p) => p.category === "PATIENT" },
  { key: "SPECIALIST", label: "Waiting on specialist", match: (p) => p.category === "SPECIALIST" },
  { key: "CLOSED_LOOP", label: "Closed-loop gap · missing specialist note", match: (p) => p.category === "CLOSED_LOOP" },
  { key: "ON_TRACK", label: "On track", match: (p) => p.workflowStatus === "On track" },
];

export const STATUS_TAB_KEYS = ["EVERYTHING", "ALL", "URGENT", "ON_TRACK"];
export const CHIP_KEYS = ["INSURANCE", "ACCESS", "PATIENT", "SPECIALIST", "CLOSED_LOOP"];
export const DEFAULT_FILTER = "ALL";

export function sortByRisk(patients) {
  return [...patients].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
}

export function getBucket(key) {
  return BUCKETS.find((b) => b.key === key) || BUCKETS.find((b) => b.key === DEFAULT_FILTER);
}

export function filterReferrals(patients, key) {
  return sortByRisk(patients).filter(getBucket(key).match);
}
