const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { ALLOWED_ORIGINS, NODE_ENV } = require('./config/env');

const app = express();

/**
 * Production (yoki TRUST_PROXY=1): reverse proxy orqasidagi real client IP.
 * express-rate-limit guest endpoint uchun kerak — aks holda hammasi bitta IP.
 * TRUST_PROXY=0 bilan o‘chiriladi (local/dev default).
 */
const trustProxyEnv = String(process.env.TRUST_PROXY || '').trim().toLowerCase();
if (
  trustProxyEnv === '1' ||
  trustProxyEnv === 'true' ||
  (NODE_ENV === 'production' && trustProxyEnv !== '0' && trustProxyEnv !== 'false')
) {
  app.set('trust proxy', 1);
}

const allowedOrigins = new Set(ALLOWED_ORIGINS);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests and non-browser clients.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Deny without throwing so the request still gets a normal CORS failure
      // instead of an unhandled error that can omit ACAO headers.
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
// Auth/admin JSON only — media goes direct-to-R2 (no base64 bodies)
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/v1', routes);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
