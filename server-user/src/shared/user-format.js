'use strict';

const isTechnicalUserId = (value) =>
  typeof value === 'string' && /^usr_/i.test(value);

export const formatUserDisplayName = (user) => {
  if (!user) return null;

  const username = (user.username ?? user.Username ?? '').trim();
  const name = user.name ?? user.Name ?? '';
  const surname = user.surname ?? user.Surname ?? '';
  const fullName = `${name} ${surname}`.trim();

  if (username) return username;
  if (fullName) return fullName;

  const rawId = user.id ?? user.Id ?? null;
  return rawId && !isTechnicalUserId(rawId) ? rawId : null;
};
