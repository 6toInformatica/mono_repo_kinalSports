import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { HelmetOptions } from 'helmet';

export const helmetConfiguration: HelmetOptions = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  // HSTS desactivado: el servicio corre detrás de HTTP en desarrollo
  strictTransportSecurity: false,
  frameguard: { action: 'deny' },
  noSniff: true,
  hidePoweredBy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
};

const envInt = (name: string, fallback: number) =>
  Number.parseInt(process.env[name] ?? '', 10) || fallback;

/**
 * Límite general por IP (100 peticiones / 15 min por defecto). Es middleware de Express
 * para contar todas las rutas, incluidas las inexistentes, y conservar la respuesta.
 */
export const requestLimit = rateLimit({
  windowMs: envInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: envInt('RATE_LIMIT_MAX', 100),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } })
      .rateLimit?.resetTime;
    res.status(429).json({
      success: false,
      message:
        'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: resetTime
        ? Math.round((resetTime.getTime() - Date.now()) / 1000)
        : undefined,
    });
  },
});

/** Ruta inexistente fuera del prefijo (Nest responde las de dentro) */
export const notFoundFallback = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado en Admin API',
  });
};
