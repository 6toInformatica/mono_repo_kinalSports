import { body, param } from '../common/validation/request-rules.js';

const CATEGORIES = ['FUTBOL_7', 'FUTBOL_11'];
const ID_MESSAGE = 'ID debe ser un ObjectId válido de MongoDB';
const MANAGER_ID = /^[A-Za-z0-9_-]{6,64}$/;

const managerId = () =>
  body('managerId')
    .notEmpty('El ID del manager es requerido')
    .isString('El ID del manager debe ser texto')
    .matches(MANAGER_ID, 'ID de manager inválido');

const namedMembers = () =>
  body('namedMembers')
    .optional()
    .isString('namedMembers debe enviarse como JSON en texto');

export const createTeamRules = [
  body('teamName')
    .trim()
    .notEmpty('El nombre del equipo es requerido')
    .isLength(
      { min: 2, max: 100 },
      'El nombre debe tener entre 2 y 100 caracteres'
    ),
  managerId(),
  body('category')
    .notEmpty('La categoría es requerida')
    .isIn(CATEGORIES, 'Categoría no válida'),
  namedMembers(),
];

export const updateTeamRules = [
  param('id').isMongoId(ID_MESSAGE),
  body('teamName')
    .optional()
    .trim()
    .isLength(
      { min: 2, max: 100 },
      'El nombre debe tener entre 2 y 100 caracteres'
    ),
  body('category').optional().isIn(CATEGORIES, 'Categoría no válida'),
  namedMembers(),
];

export const changeManagerRules = [
  param('id').isMongoId(ID_MESSAGE),
  managerId(),
];

export const removeNamedMemberRules = [
  param('id').isMongoId(ID_MESSAGE),
  param('memberId').isMongoId(
    'ID de miembro debe ser un ObjectId válido de MongoDB'
  ),
];

/** Integrantes sin cuenta: JSON en texto o arreglo, de nombres o de { name } */
export const parseNamedMembers = (input: unknown) => {
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
    .map((member: unknown) =>
      typeof member === 'string'
        ? { name: member.trim() }
        : { name: (member as { name?: string })?.name?.trim() ?? '' }
    )
    .filter((member) => member.name.length > 0);
};

/** El capitán siempre forma parte de los miembros del equipo */
export const ensureManagerInMembers = (
  managerId: string | undefined,
  members: unknown[] = []
) => {
  if (!managerId) return members.map(String);
  const unique = new Set(members.map((member) => String(member)));
  unique.add(String(managerId));
  return Array.from(unique);
};
