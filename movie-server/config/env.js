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
};
