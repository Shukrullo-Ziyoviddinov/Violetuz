const crypto = require('crypto');
const { NODE_ENV, JWT_EXPIRES_IN } = require('../config/env');

const AUTH_COOKIE_NAME = 'violet_auth';
const DEVICE_COOKIE_NAME = 'violet_device';

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

/** Auth JWT — qisqa/o‘rtacha muddat */
const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  maxAge: parseExpiresToMs(JWT_EXPIRES_IN),
});

/** Qurilma kaliti — ko‘p hisob bog‘lash uchun uzoq muddat (1 yil) */
const getDeviceCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  maxAge: 365 * 24 * 60 * 60 * 1000,
});

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
};

const hashDeviceKey = (raw) =>
  crypto.createHash('sha256').update(String(raw)).digest('hex');

/**
 * httpOnly qurilma kalitini o‘qiydi yoki yangisini yozadi.
 * JS localStorage ga token qo‘ymaydi — faqat server biladi.
 */
const ensureDeviceKey = (req, res) => {
  const existing = req.cookies?.[DEVICE_COOKIE_NAME];
  if (existing && String(existing).length >= 32) {
    return String(existing);
  }
  const created = crypto.randomBytes(32).toString('hex');
  res.cookie(DEVICE_COOKIE_NAME, created, getDeviceCookieOptions());
  return created;
};

const readDeviceKey = (req) => {
  const raw = req.cookies?.[DEVICE_COOKIE_NAME];
  return raw && String(raw).length >= 32 ? String(raw) : null;
};

module.exports = {
  AUTH_COOKIE_NAME,
  DEVICE_COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
  ensureDeviceKey,
  readDeviceKey,
  hashDeviceKey,
};
