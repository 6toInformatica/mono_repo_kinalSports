import jwt from 'jsonwebtoken';

const ACCESS_COOKIE = 'kinal_access';

const readCookieToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === ACCESS_COOKIE) {
      const value = rest.join('=').trim();
      if (!value) return null;
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
};

/**
 * Único middleware de autenticación del servicio. Valida el access token
 * (Authorization: Bearer o cookie httpOnly `kinal_access`) con el secreto,
 * emisor y audiencia compartidos con los servicios de auth, y deja en req.user
 * el id y el rol del usuario.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : null;
  const token = bearerToken || readCookieToken(req.header('Cookie'));

  if (!token) {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);

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
