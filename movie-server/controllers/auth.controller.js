const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/auth.service');

const checkUsername = asyncHandler(async (req, res) => {
  const result = await authService.checkUsernameAvailability(
    req.query.username || req.params.username
  );
  return sendSuccess(res, { data: result });
});

const registerStart = asyncHandler(async (req, res) => {
  const data = await authService.startRegister(req.body || {});
  return sendSuccess(res, { data }, 200);
});

const registerVerify = asyncHandler(async (req, res) => {
  const data = await authService.verifyRegister(req.body || {});
  return sendSuccess(res, { data }, 201);
});

const loginStart = asyncHandler(async (req, res) => {
  const data = await authService.startLogin(req.body || {});
  return sendSuccess(res, { data }, 200);
});

const loginVerify = asyncHandler(async (req, res) => {
  const data = await authService.verifyLogin(req.body || {});
  return sendSuccess(res, { data }, 200);
});

module.exports = {
  checkUsername,
  registerStart,
  registerVerify,
  loginStart,
  loginVerify,
};
