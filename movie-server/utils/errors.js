const createHttpError = (status, message, details) => {
  const error = new Error(message);
  error.status = status;

  if (details) {
    error.details = details;
  }

  return error;
};

const badRequest = (message, details) => createHttpError(400, message, details);
const notFound = (message, details) => createHttpError(404, message, details);

module.exports = {
  createHttpError,
  badRequest,
  notFound,
};
