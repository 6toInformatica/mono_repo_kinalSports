export const mapProfileToForm = (userData = {}) => {
  const sportsArray = Array.isArray(userData.favoriteSports)
    ? userData.favoriteSports
    : typeof userData.favoriteSports === "string"
      ? userData.favoriteSports
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const fullName = `${userData.name ?? ""} ${userData.surname ?? ""}`.trim();

  return {
    displayName:
      userData.displayName?.trim() || fullName || userData.username || "",
    phone: userData.phone ?? "",
    favoriteSports: sportsArray.join(", "),
  };
};

export const getProfileDisplayName = (profile = {}, storedUser = {}) => {
  const fullName = `${profile.name ?? storedUser.name ?? ""} ${
    profile.surname ?? storedUser.surname ?? ""
  }`.trim();

  return (
    profile.displayName?.trim() ||
    fullName ||
    profile.username ||
    storedUser.username ||
    profile.name ||
    storedUser.name ||
    "Mi perfil"
  );
};

export const getProfileEmail = (profile = {}, storedUser = {}) =>
  profile.email ?? storedUser.email ?? "Sin correo";

const DEFAULT_AVATAR_MARKERS = ["avatarDefault", "default_avatar", "nyvxo5"];

export const isDefaultAvatarUrl = (value) => {
  if (!value || typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return DEFAULT_AVATAR_MARKERS.some((marker) => trimmed.includes(marker));
};

export const getProfileAvatar = (profile = {}, storedUser = {}) =>
  profile.avatar ??
  profile.profilePicture ??
  storedUser.profilePicture ??
  storedUser.avatar ??
  null;

export const resolveProfileAvatarUri = (profile = {}, storedUser = {}) => {
  const raw = getProfileAvatar(profile, storedUser);
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  if (isDefaultAvatarUrl(trimmed)) {
    return null;
  }

  return trimmed;
};
