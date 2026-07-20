const { NODE_ENV } = require('../config/env');
const { sendError } = require('../utils/response');

module.exports = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const details = err.details;

  if (status >= 500) {
    console.error(err);
  }

  if (NODE_ENV !== 'production' && err.stack && !details) {
    return sendError(res, message, status, { stack: err.stack });
  }

  return sendError(res, message, status, details);
};
