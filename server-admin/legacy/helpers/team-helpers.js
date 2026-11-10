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

export const ensureManagerInMembers = (managerId, members = []) => {
  if (!managerId) return members;
  const uniqueMembers = new Set(members.map((member) => member.toString()));
  uniqueMembers.add(managerId.toString());
  return Array.from(uniqueMembers);
};
