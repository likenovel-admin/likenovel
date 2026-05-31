interface HomeQueryStateInput {
  isAuthInitialized: boolean;
  isAuthenticated: boolean;
  accessToken?: string | null;
  userId?: number | string | null;
}

function getTokenFingerprint(accessToken?: string | null): string | null {
  if (!accessToken) return null;

  let hash = 5381;
  for (let i = 0; i < accessToken.length; i += 1) {
    hash = (hash * 33) ^ accessToken.charCodeAt(i);
  }

  return (hash >>> 0).toString(36);
}

export function getHomeQueryState({
  isAuthInitialized,
  isAuthenticated,
  accessToken,
  userId,
}: HomeQueryStateInput) {
  const hasUserId = userId !== undefined && userId !== null && userId !== "";
  const hasAuthSignal = isAuthenticated || Boolean(accessToken);
  const tokenFingerprint = getTokenFingerprint(accessToken);
  const productCacheIdentity = tokenFingerprint
    ? `token:${tokenFingerprint}`
    : hasAuthSignal && hasUserId
      ? `user:${userId}`
      : "guest";
  const userScopedCacheIdentity = hasAuthSignal && hasUserId ? `user:${userId}` : null;

  return {
    enabled: isAuthInitialized,
    productCacheIdentity,
    userScopedCacheIdentity,
    canUseUserScopedQueries: isAuthInitialized && Boolean(userScopedCacheIdentity),
  };
}
