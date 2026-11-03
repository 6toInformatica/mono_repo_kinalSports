import jwt from 'jsonwebtoken';

/**
 * Middleware para validar el token JWT en el servicio de usuario.
 * Solo verifica tokens firmados con el JWT_SECRET compartido.
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar token con el secreto compartido, emisor y audiencia (igual que server-admin)
    const verifyOptions = { algorithms: ['HS256'] };
    if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE)
      verifyOptions.audience = process.env.JWT_AUDIENCE;

    const decoded = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);

    // Guardar payload decodificado en req.user
    // Soporta múltiples formatos de payload (sub/id/role)
    // Se usa el spread al inicio para que id y role específicos prevalezcan
    req.user = {
      ...decoded,
      id: decoded.sub || decoded.uid || decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('Error de autenticación JWT:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};
