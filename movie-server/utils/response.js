const sendSuccess = (res, payload = {}, status = 200) => {
  res.status(status).json({
    success: true,
    ...payload,
  });
};

const sendError = (res, message, status = 500, details) => {
  const body = {
    success: false,
    message,
  };

  if (details) {
    body.details = details;
  }

  res.status(status).json(body);
};

module.exports = {
  sendSuccess,
  sendError,
};
