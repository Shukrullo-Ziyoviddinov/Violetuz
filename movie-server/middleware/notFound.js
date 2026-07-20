const { sendError } = require('../utils/response');

module.exports = (req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
