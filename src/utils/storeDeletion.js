// Store deletion cooldown (mirrors store-backend services/storePurge.js):
// deleting a store only schedules it; it is purged this many days later.
export const DELETION_COOLDOWN_DAYS = 14;

// Whole days left before a scheduled store is purged (0 on the last day).
export function deletionDaysLeft(at) {
  if (!at) return null;
  const ms = new Date(at).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.min(DELETION_COOLDOWN_DAYS, Math.ceil(ms / 86400000)));
}
