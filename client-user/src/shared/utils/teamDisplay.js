const TECHNICAL_ID_PATTERN = /^usr_/i;

export const isTechnicalUserId = (value) =>
  typeof value === "string" && TECHNICAL_ID_PATTERN.test(value);

export const resolveMemberLabel = (profile, authUser = null) => {
  if (!profile) return "Miembro";

  const username = profile.username?.trim();
  if (username) return username;

  const displayName = profile.displayName?.trim();
  if (displayName && !isTechnicalUserId(displayName)) {
    return displayName;
  }

  const authUserId = authUser?.id ?? authUser?._id ?? null;
  if (
    authUserId &&
    profile.userId &&
    String(authUserId) === String(profile.userId) &&
    authUser?.username
  ) {
    return authUser.username;
  }

  return "Miembro";
};

export const resolveCaptainName = (team, authUser = null) => {
  const captainProfile = team?.memberProfiles?.find(
    (profile) => profile.isCaptain,
  );

  const candidates = [
    team?.managerName,
    captainProfile?.username,
    captainProfile?.displayName,
    team?.captain?.username,
    team?.captain?.name,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim?.() ?? candidate;
    if (value && !isTechnicalUserId(value)) {
      return value;
    }
  }

  if (
    authUser?.username &&
    captainProfile?.userId &&
    String(authUser.id ?? authUser._id) === String(captainProfile.userId)
  ) {
    return authUser.username;
  }

  return "—";
};
