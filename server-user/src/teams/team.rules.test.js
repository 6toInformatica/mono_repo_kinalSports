import { describe, expect, it } from 'vitest';
import {
  ensureManagerInMembers,
  getMaxMembers,
  parseNamedMembers,
} from './team.rules.js';

describe('parseNamedMembers', () => {
  it('acepta arreglos de texto u objetos, en JSON o ya parseados', () => {
    expect(parseNamedMembers('["Kevin", {"name":" Pablo "}]')).toEqual([
      { name: 'Kevin' },
      { name: 'Pablo' },
    ]);
    expect(parseNamedMembers(['Kevin'])).toEqual([{ name: 'Kevin' }]);
  });

  it('descarta nombres vacíos y entradas inválidas', () => {
    expect(parseNamedMembers(['', '  ', { name: null }])).toEqual([]);
    expect(parseNamedMembers('no es json')).toEqual([]);
    expect(parseNamedMembers({ name: 'x' })).toEqual([]);
    expect(parseNamedMembers(undefined)).toEqual([]);
  });
});

describe('getMaxMembers', () => {
  it('12 en Fútbol 7, 18 en Fútbol 11 y 18 por defecto', () => {
    expect(getMaxMembers('FUTBOL_7')).toBe(12);
    expect(getMaxMembers('FUTBOL_11')).toBe(18);
    expect(getMaxMembers('OTRA')).toBe(18);
  });
});

describe('ensureManagerInMembers', () => {
  it('agrega al capitán una sola vez', () => {
    expect(ensureManagerInMembers('usr_1', ['usr_2', 'usr_1'])).toEqual([
      'usr_2',
      'usr_1',
    ]);
    expect(ensureManagerInMembers('usr_1')).toEqual(['usr_1']);
  });
});
