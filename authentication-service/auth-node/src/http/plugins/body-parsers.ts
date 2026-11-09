import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { AppConfig } from '../../config/env.ts';

/**
 * Cuerpos aceptados: JSON, formularios urlencoded y multipart (archivos).
 * - Un JSON vacío se trata como {} (como express.json).
 * - Un content-type desconocido no se rechaza: el cuerpo queda sin leer (undefined).
 */
export const bodyParsersPlugin = fp(
  async (app: FastifyInstance, { config }: { config: AppConfig }) => {
    app.removeContentTypeParser('application/json');
    app.addContentTypeParser(
      'application/json',
      { parseAs: 'string' },
      (_request, body, done) => {
        const text = typeof body === 'string' ? body : body.toString('utf8');
        if (!text.trim()) {
          done(null, {});
          return;
        }
        try {
          done(null, JSON.parse(text));
        } catch {
          const error = Object.assign(
            new Error('El cuerpo de la petición no es un JSON válido'),
            { statusCode: 400 }
          );
          done(error, undefined);
        }
      }
    );

    app.addContentTypeParser('*', (_request, payload, done) => {
      payload.resume();
      payload.on('end', () => done(null, undefined));
      payload.on('error', (error) => done(error, undefined));
    });

    await app.register(formbody);
    await app.register(multipart, {
      limits: { fileSize: config.upload.maxSize },
    });
  }
);
