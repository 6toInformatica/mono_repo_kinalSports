'use strict';

export const parseNamedMembers = (input) => {
  if (!input) return [];

  let raw = input;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .map((member) => {
      if (typeof member === 'string') {
        return { name: member.trim() };
      }
      return { name: member?.name?.trim() ?? '' };
    })
    .filter((member) => member.name.length > 0);
};

// Cupo de miembros registrados por categoría (titulares + suplentes)
export const MAX_MEMBERS_BY_CATEGORY = {
  FUTBOL_7: 12,
  FUTBOL_11: 18,
};

export const getMaxMembers = (category) =>
  MAX_MEMBERS_BY_CATEGORY[category] ?? MAX_MEMBERS_BY_CATEGORY.FUTBOL_11;

export const ensureManagerInMembers = (managerId, members = []) => {
  if (!managerId) return members;
  const uniqueMembers = new Set(members.map((member) => member.toString()));
  uniqueMembers.add(managerId.toString());
  return Array.from(uniqueMembers);
};
