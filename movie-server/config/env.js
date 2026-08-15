require('dotenv').config();

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const CLIENT_URLS = String(process.env.CLIENT_URLS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL || '';
const BREVO_API_KEY = String(process.env.BREVO_API_KEY || '').trim();
const BREVO_SENDER_EMAIL = String(process.env.BREVO_SENDER_EMAIL || '').trim();
const BREVO_SENDER_NAME = String(process.env.BREVO_SENDER_NAME || 'VioletPlay').trim();
const JWT_SECRET = process.env.JWT_SECRET || 'violet-dev-jwt-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

const R2_ACCOUNT_ID = String(process.env.R2_ACCOUNT_ID || '').trim();
const R2_ACCESS_KEY_ID = String(process.env.R2_ACCESS_KEY_ID || '').trim();
const R2_SECRET_ACCESS_KEY = String(process.env.R2_SECRET_ACCESS_KEY || '').trim();
const R2_BUCKET_NAME = String(process.env.R2_BUCKET_NAME || 'violetplay').trim();
const R2_PUBLIC_URL = String(process.env.R2_PUBLIC_URL || '')
  .trim()
  .replace(/\/+$/, '');
const R2_ENDPOINT = String(
  process.env.R2_ENDPOINT ||
    (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')
).trim();

/** Comma-separated emails/usernames promoted to admin on login/me */
const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);
const ADMIN_USERNAMES = new Set(
  String(process.env.ADMIN_USERNAMES || '')
    .split(',')
    .map((item) => item.trim().toLowerCase().replace(/^@+/, ''))
    .filter(Boolean)
);

const ALLOWED_ORIGINS = Array.from(
  new Set([
    CLIENT_URL,
    ...CLIENT_URLS,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    ...(NODE_ENV === 'production' ? ['https://violetuz.vercel.app'] : []),
  ])
);

module.exports = {
  PORT,
  NODE_ENV,
  CLIENT_URL,
  CLIENT_URLS,
  ALLOWED_ORIGINS,
  DATABASE_URL,
  BREVO_API_KEY,
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  ADMIN_EMAILS,
  ADMIN_USERNAMES,
};
