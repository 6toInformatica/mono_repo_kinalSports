import jwt from 'jsonwebtoken';

/**
 * Único middleware de autenticación del servicio. Valida el access token
 * (Authorization: Bearer) con el secreto, emisor y audiencia compartidos con los
 * servicios de auth, y deja en req.user el id y el rol del usuario.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado',
    });
  }

  try {
    const verifyOptions = { algorithms: ['HS256'] };
    if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) {
      verifyOptions.audience = process.env.JWT_AUDIENCE;
    }

    const decoded = jwt.verify(
      authHeader.replace('Bearer ', ''),
      process.env.JWT_SECRET,
      verifyOptions
    );

    req.user = {
      id: decoded.sub || decoded.uid || decoded.id,
      role: decoded.role || 'USER_ROLE',
    };

    return next();
  } catch (error) {
    console.error('Error de autenticación JWT:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};
