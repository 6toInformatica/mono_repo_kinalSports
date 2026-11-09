import rateLimit from 'express-rate-limit';

// Límites configurables por entorno; los valores por defecto son los de producción
const envInt = (name, fallback) =>
  Number.parseInt(process.env[name], 10) || fallback;

export const requestLimit = rateLimit({
  windowMs: envInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutos
  max: envInt('RATE_LIMIT_MAX', 100), // 100 requests por ventana por IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60, // 15 minutos en segundos
  },
  standardHeaders: true, // Retorna rate limit info en los headers `RateLimit-*`
  legacyHeaders: false, // Desactiva los headers `X-RateLimit-*`
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});
