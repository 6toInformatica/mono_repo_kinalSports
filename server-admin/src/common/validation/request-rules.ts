import type { Request } from 'express';
import validator from 'validator';

/**
 * Reglas de validación de peticiones con la misma semántica que express-validator:
 * - cada validador que falla agrega su error (salvo después de `bail()`);
 * - `optional()` omite la cadena si el campo no viene;
 * - `trim()` reemplaza el valor del campo en la petición;
 * - los errores de parámetros y cuerpo se acumulan en una sola lista, en orden.
 */
type Location = 'body' | 'params';
type Container = Record<string, unknown>;

type Step =
  | { kind: 'sanitize'; apply: (value: unknown) => unknown }
  | {
      kind: 'validate';
      test: (value: unknown, req: Request) => boolean;
      message: string;
    }
  | { kind: 'bail' };

export interface ValidationIssue {
  field: string;
  message: string;
}

/** Igual que express-validator: los validadores de texto trabajan sobre String(valor) */
const asText = (value: unknown) =>
  value === undefined || value === null ? '' : String(value);

export class RuleChain {
  readonly #steps: Step[] = [];
  #optional = false;

  constructor(
    readonly location: Location,
    readonly path: string
  ) {}

  optional() {
    this.#optional = true;
    return this;
  }

  trim() {
    this.#steps.push({ kind: 'sanitize', apply: (v) => asText(v).trim() });
    return this;
  }

  bail() {
    this.#steps.push({ kind: 'bail' });
    return this;
  }

  #check(test: (value: unknown, req: Request) => boolean, message: string) {
    this.#steps.push({ kind: 'validate', test, message });
    return this;
  }

  notEmpty(message: string) {
    return this.#check((v) => asText(v).length > 0, message);
  }

  isLength({ min = 0, max }: { min?: number; max?: number }, message: string) {
    return this.#check((v) => {
      const length = asText(v).length;
      return length >= min && (max === undefined || length <= max);
    }, message);
  }

  isIn(values: readonly string[], message: string) {
    return this.#check((v) => values.includes(asText(v)), message);
  }

  isFloat(options: { min?: number }, message: string) {
    return this.#check((v) => validator.isFloat(asText(v), options), message);
  }

  isString(message: string) {
    return this.#check((v) => typeof v === 'string', message);
  }

  matches(pattern: RegExp, message: string) {
    return this.#check((v) => pattern.test(asText(v)), message);
  }

  isISO8601(message: string) {
    return this.#check((v) => validator.isISO8601(asText(v)), message);
  }

  isMongoId(message: string) {
    return this.#check((v) => validator.isMongoId(asText(v)), message);
  }

  isArray(message: string) {
    return this.#check((v) => Array.isArray(v), message);
  }

  /** `test` lanza un Error con el mensaje, como los custom de express-validator */
  custom(test: (value: unknown, req: Request) => void) {
    const step: Step & { kind: 'validate' } = {
      kind: 'validate',
      message: '',
      test: (value, req) => {
        try {
          test(value, req);
          return true;
        } catch (error) {
          step.message = (error as Error).message;
          return false;
        }
      },
    };
    this.#steps.push(step);
    return this;
  }

  /** Instancias del campo: una sola, o cada elemento si la ruta termina en `.*` */
  #instances(container: Container) {
    if (!this.path.endsWith('.*')) {
      return [{ key: this.path, field: this.path, parent: container }];
    }
    const name = this.path.slice(0, -2);
    const list = container[name];
    if (!Array.isArray(list)) return [];
    return list.map((_, index) => ({
      key: String(index),
      field: `${name}[${index}]`,
      parent: list as unknown as Container,
    }));
  }

  run(req: Request): ValidationIssue[] {
    const container = (req[this.location] ?? {}) as Container;
    const issues: ValidationIssue[] = [];

    for (const { key, field, parent } of this.#instances(container)) {
      let value = parent[key];
      if (this.#optional && value === undefined) continue;

      let failed = false;
      for (const step of this.#steps) {
        if (step.kind === 'bail') {
          if (failed) break;
          continue;
        }
        if (step.kind === 'sanitize') {
          value = step.apply(value);
          parent[key] = value;
          continue;
        }
        if (!step.test(value, req)) {
          failed = true;
          issues.push({ field, message: step.message });
        }
      }
    }
    return issues;
  }
}

export const body = (path: string) => new RuleChain('body', path);
export const param = (path: string) => new RuleChain('params', path);

export type RequestRules = RuleChain[];
