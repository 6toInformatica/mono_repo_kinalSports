'use strict';

export const formatUserDisplayName = (user) => {
  if (!user) return null;

  const username = user.username ?? user.Username ?? '';
  const name = user.name ?? user.Name ?? '';
  const surname = user.surname ?? user.Surname ?? '';
  const fullName = `${name} ${surname}`.trim();

  return fullName || username || user.id || user.Id || null;
};
