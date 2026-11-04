import crypto from 'crypto';

/**
 * Compara tokens en tiempo constante para evitar timing attacks.
 */
const compareTokens = (tokenA, tokenB) => {
  if (!tokenA || !tokenB) return false;

  const bufferA = Buffer.from(tokenA);
  const bufferB = Buffer.from(tokenB);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
};

/**
 * Permite el acceso solo a servicios internos (server-user / server-admin)
 * que envíen el header 'x-internal-token'.
 */
export const validateInternalToken = (req, res, next) => {
  const secretToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!secretToken) {
    console.warn('INTERNAL_SERVICE_TOKEN no está configurado en auth-node');
  }

  if (compareTokens(req.header('x-internal-token'), secretToken)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Acceso denegado: Token interno inválido o ausente',
  });
};
