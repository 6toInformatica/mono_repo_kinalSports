const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;

  try {
    const segment = token.split(".")[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    if (typeof globalThis.atob !== "function") return null;

    const decoded = globalThis.atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getTokenUserId = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload.sub ?? payload.id ?? payload.uid ?? null;
};

export const normalizeAuthUser = (user, token) => {
  const tokenUserId = getTokenUserId(token);
  const resolvedId = user?.id ?? user?._id ?? tokenUserId ?? null;

  return {
    ...(user ?? {}),
    id: resolvedId,
    username: user?.username ?? user?.Username ?? "",
    email: user?.email ?? user?.Email ?? "",
    name: user?.name ?? user?.Name ?? "",
    surname: user?.surname ?? user?.Surname ?? "",
    profilePicture:
      user?.profilePicture ?? user?.ProfilePicture ?? user?.avatar ?? "",
    avatar: user?.avatar ?? user?.profilePicture ?? user?.ProfilePicture ?? "",
  };
};

export const getAuthUserId = (user, token) => {
  const normalized = normalizeAuthUser(user, token);
  return normalized.id ? String(normalized.id) : null;
};
