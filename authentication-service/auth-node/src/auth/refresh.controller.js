import { RefreshToken } from './refreshToken.model.js';
import { hashToken, saveRefreshToken } from '../../helpers/refresh-token.js';
import { generateJWT } from '../../helpers/generate-jwt.js';
import { asyncHandler } from '../../helpers/async-handler.js';
import { getUserRoleNames } from '../../helpers/role-db.js';
import { USER_ROLE } from '../../helpers/role-constants.js';
import { User } from '../users/user.model.js';

// POST /auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token requerido' });
  }
  const tokenHash = hashToken(refreshToken);
  const doc = await RefreshToken.findOne({
    where: { TokenHash: tokenHash },
  });
  if (!doc) {
    return res.status(401).json({ message: 'Refresh token inválido' });
  }
  if (doc.ExpiresAt < new Date()) {
    doc.RevokedAt = new Date();
    await doc.save();
    return res.status(401).json({ message: 'Refresh token expirado' });
  }
  if (doc.RevokedAt) {
    // Reutilización detectada: revocar toda la familia
    await RefreshToken.update(
      { RevokedAt: new Date() },
      { where: { FamilyId: doc.FamilyId } }
    );
    return res
      .status(401)
      .json({ message: 'Sesión comprometida. Refresh token reutilizado.' });
  }
  // Revocar el token actual
  doc.RevokedAt = new Date();
  await doc.save();

  // Un usuario desactivado no puede seguir renovando su sesión
  const user = await User.findByPk(doc.UserId.toString(), {
    attributes: ['Id', 'Status'],
  });
  if (!user || !user.Status) {
    return res.status(401).json({ message: 'La cuenta está desactivada' });
  }
  // Generar nuevo accessToken y refreshToken (misma familia)
  // El rol se vuelve a leer de BD para que el token renovado conserve el claim `role`
  const [role = USER_ROLE] = await getUserRoleNames(doc.UserId.toString());
  const accessToken = await generateJWT(
    doc.UserId.toString(),
    { role },
    { expiresIn: '15m' }
  );
  const { raw: newRefreshToken } = await saveRefreshToken(
    doc.UserId.toString(),
    doc.FamilyId
  );
  return res.status(200).json({
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
  });
});

// POST /auth/logout
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token requerido' });
  }
  const tokenHash = hashToken(refreshToken);
  const doc = await RefreshToken.findOne({
    where: { TokenHash: tokenHash },
  });
  if (doc && !doc.RevokedAt) {
    doc.RevokedAt = new Date();
    await doc.save();
  }
  return res.status(200).json({ message: 'Sesión cerrada' });
});
