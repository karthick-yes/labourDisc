// Status → plate tone, shared by list and detail screens.
export const PLACEMENT_STATUS_TONE = {
  awaiting_payment: "warn",
  trial: "ink",
  confirmed: "ok",
  ended: "neutral",
  failed: "danger",
  cancelled: "neutral",
} as const;
export const COMMISSION_TONE = {
  unpaid: "warn",
  at_risk: "ink",
  earned: "ok",
  refunded: "danger",
  transferred: "neutral",
  lost: "danger",
} as const;
export const AVAILABILITY_TONE = { available: "ok", placed: "ink", inactive: "neutral" } as const;
export const NEED_STATUS_TONE = { open: "warn", filled: "ok", cancelled: "neutral" } as const;
