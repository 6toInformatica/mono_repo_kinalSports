import type { FastifyReply, FastifyRequest } from 'fastify';
import validator from 'validator';

/**
 * Validación de cuerpos con las mismas reglas, mensajes y orden que express-validator:
 * cada campo se recorta (si aplica) y se evalúan todas sus reglas, acumulando un error
 * por cada regla que falle.
 */
type Check = (value: string) => boolean;

interface Rule {
  check: Check;
  message: string;
}

interface FieldSchema {
  field: string;
  trim?: boolean;
  rules: Rule[];
}

export interface ValidationIssue {
  field: string;
  message: string;
  value: unknown;
}

const asText = (value: unknown): string =>
  value === undefined || value === null ? '' : String(value);

export const rule = {
  notEmpty: (message: string): Rule => ({
    check: (value) => value.length > 0,
    message,
  }),
  length: (
    { min = 0, max }: { min?: number; max?: number },
    message: string
  ): Rule => ({
    check: (value) =>
      value.length >= min && (max === undefined || value.length <= max),
    message,
  }),
  matches: (pattern: RegExp, message: string): Rule => ({
    check: (value) => pattern.test(value),
    message,
  }),
  email: (message: string): Rule => ({
    check: (value) => validator.isEmail(value),
    message,
  }),
};

export const validateBody = (
  body: unknown,
  schema: FieldSchema[]
): ValidationIssue[] => {
  const source = (body && typeof body === 'object' ? body : {}) as Record<
    string,
    unknown
  >;
  const issues: ValidationIssue[] = [];

  for (const { field, trim, rules } of schema) {
    let value: unknown = source[field];
    if (trim) {
      value = asText(value).trim();
      // Igual que express-validator: el valor recortado reemplaza al original
      if (body && typeof body === 'object') source[field] = value;
    }
    const text = asText(value);
    for (const { check, message } of rules) {
      if (!check(text)) issues.push({ field, message, value });
    }
  }

  return issues;
};

/** preHandler que responde 400 con la lista de errores si el cuerpo no es válido */
export const validate =
  (schema: FieldSchema[]) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const issues = validateBody(request.body, schema);
    if (issues.length) {
      return reply.code(400).send({
        success: false,
        message: 'Errores de validación',
        errors: issues,
      });
    }
  };
