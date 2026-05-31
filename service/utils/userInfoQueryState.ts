export const USER_INFO_QUERY_STALE_TIME_MS = 30 * 1000;

export function getUserInfoQueryIdentity(userId?: number): string {
  return typeof userId === "number" && userId > 0
    ? `user:${userId}`
    : "current";
}

export function shouldEnableUserInfoQuery({
  enabled = true,
  requiresValidUserId = false,
  userId,
}: {
  enabled?: boolean;
  requiresValidUserId?: boolean;
  userId?: number;
}): boolean {
  if (!enabled) return false;
  if (!requiresValidUserId) return true;

  return typeof userId === "number" && userId > 0;
}
