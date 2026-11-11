import {
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
  mixin,
  type Type,
} from '@nestjs/common';
import type { Request } from 'express';
import { validationError } from '../pipes/object-id.pipe.js';
import type { RequestRules } from './request-rules.js';

/**
 * Valida parámetros y cuerpo antes del handler. Va después de la subida del archivo,
 * porque en multipart el cuerpo existe recién cuando multer lo procesa.
 */
export const ValidateRequest = (rules: RequestRules): Type<NestInterceptor> => {
  class ValidateRequestInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
      const req = context.switchToHttp().getRequest<Request>();
      const issues = rules.flatMap((rule) => rule.run(req));
      if (issues.length) throw validationError(issues);
      return next.handle();
    }
  }
  return mixin(ValidateRequestInterceptor);
};
