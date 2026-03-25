import { RefreshToken } from './refreshToken.model.js';
import { hashToken, saveRefreshToken } from '../../helpers/refresh-token.js';
import { generateJWT } from '../../helpers/generate-jwt.js';
import { asyncHandler } from '../../helpers/async-handler.js';

// POST /auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token requerido' });
  }
  const tokenHash = hashToken(refreshToken);
  const doc = await RefreshToken.findOne({ tokenHash });
  if (!doc) {
    return res.status(401).json({ message: 'Refresh token inválido' });
  }
  if (doc.expiresAt < new Date()) {
    doc.revokedAt = new Date();
    await doc.save();
    return res.status(401).json({ message: 'Refresh token expirado' });
  }
  if (doc.revokedAt) {
    // Reutilización detectada: revocar toda la familia
    await RefreshToken.updateMany(
      { familyId: doc.familyId },
      { $set: { revokedAt: new Date() } }
    );
    return res
      .status(401)
      .json({ message: 'Sesión comprometida. Refresh token reutilizado.' });
  }
  // Revocar el token actual
  doc.revokedAt = new Date();
  await doc.save();
  // Generar nuevo accessToken y refreshToken (misma familia)
  const accessToken = await generateJWT(
    doc.userId.toString(),
    {},
    { expiresIn: '15m' }
  );
  const { raw: newRefreshToken } = await saveRefreshToken(
    doc.userId.toString(),
    doc.familyId
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
  const doc = await RefreshToken.findOne({ tokenHash });
  if (doc && !doc.revokedAt) {
    doc.revokedAt = new Date();
    await doc.save();
  }
  return res.status(200).json({ message: 'Sesión cerrada' });
});
