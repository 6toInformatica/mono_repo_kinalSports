import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../configs/config.js';

export const generateJWT = (userId, extraClaims = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    // JWT payload with sub, jti, iat, and optional role
    const payload = {
      sub: String(userId), // Ensure sub is string to match .NET behavior
      jti: crypto.randomUUID(), // Match .NET Guid.NewGuid()
      iat: Math.floor(Date.now() / 1000), // Match .NET DateTimeOffset.UtcNow.ToUnixTimeSeconds()
      ...extraClaims, // Include role and other claims
    };

    const signOptions = {
      expiresIn: options.expiresIn || config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    };

    jwt.sign(payload, config.jwt.secret, signOptions, (err, token) => {
      if (err) {
        console.error('Error generating JWT:', err);
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

export const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    // Mismas validaciones que auth-service y server-admin: algoritmo, emisor y audiencia
    const verifyOptions = { algorithms: ['HS256'] };
    if (config.jwt.issuer) verifyOptions.issuer = config.jwt.issuer;
    if (config.jwt.audience) verifyOptions.audience = config.jwt.audience;

    jwt.verify(token, config.jwt.secret, verifyOptions, (err, decoded) => {
      if (err) {
        console.error('Error verifying JWT:', err);
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

export const generateVerificationToken = (userId, type, expiresIn = '24h') => {
  return new Promise((resolve, reject) => {
    const payload = {
      sub: String(userId),
      type: type,
      iat: Math.floor(Date.now() / 1000),
    };

    const signOptions = {
      expiresIn,
      jwtid: crypto.randomUUID(),
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    };

    jwt.sign(payload, config.jwt.secret, signOptions, (err, token) => {
      if (err) {
        console.error('Error generating verification token:', err);
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

export const verifyVerificationToken = (token) => {
  return verifyJWT(token);
};
