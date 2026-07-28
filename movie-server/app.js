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

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/v1', routes);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
