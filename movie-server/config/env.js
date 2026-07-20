require('dotenv').config();

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const CLIENT_URLS = String(process.env.CLIENT_URLS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL || '';
const ALLOWED_ORIGINS = Array.from(
  new Set([
    CLIENT_URL,
    ...CLIENT_URLS,
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
};
