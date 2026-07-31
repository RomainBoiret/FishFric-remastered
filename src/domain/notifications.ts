/** Retention rules so the inbox stays small in UI and in the database. */
export const NOTIFICATION_RULES = Object.freeze({
  /** Hard cap of stored notifications per user (oldest dropped). */
  maxPerUser: 10,
  /** How many to show in the notification center. */
  listTake: 10,
});
