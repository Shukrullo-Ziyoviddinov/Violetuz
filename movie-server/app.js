const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { ALLOWED_ORIGINS, NODE_ENV } = require('./config/env');

const app = express();

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
