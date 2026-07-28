const { NODE_ENV, JWT_EXPIRES_IN } = require('../config/env');

const AUTH_COOKIE_NAME = 'violet_auth';

/** JWT_EXPIRES_IN (masalan 30d) → cookie maxAge (ms) */
const parseExpiresToMs = (value) => {
  const raw = String(value || '30d').trim();
  const match = /^(\d+)([smhd])$/i.exec(raw);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * (mult[unit] || mult.d);
};

const isProd = NODE_ENV === 'production';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  // Cross-site (Vercel ↔ Render) uchun productionda None; localda Lax
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  maxAge: parseExpiresToMs(JWT_EXPIRES_IN),
});

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
};

module.exports = {
  AUTH_COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
};
