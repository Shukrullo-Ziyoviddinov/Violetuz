const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/auth.service');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');

const sendAuthSuccess = (res, payload, status = 200) => {
  setAuthCookie(res, payload.token);
  return sendSuccess(res, { data: { user: payload.user } }, status);
};

const checkUsername = asyncHandler(async (req, res) => {
  const excludeUserId = req.authUser?._id || null;
  const result = await authService.checkUsernameAvailability(
    req.query.username || req.params.username,
    excludeUserId
  );
  return sendSuccess(res, { data: result });
});

const registerStart = asyncHandler(async (req, res) => {
  const data = await authService.startRegister(req.body || {});
  return sendSuccess(res, { data }, 200);
});

const registerVerify = asyncHandler(async (req, res) => {
  const data = await authService.verifyRegister(req.body || {});
  return sendAuthSuccess(res, data, 201);
});

const loginStart = asyncHandler(async (req, res) => {
  const data = await authService.startLogin(req.body || {});
  return sendSuccess(res, { data }, 200);
});

const loginVerify = asyncHandler(async (req, res) => {
  const data = await authService.verifyLogin(req.body || {});
  return sendAuthSuccess(res, data, 200);
});

const loginUsername = asyncHandler(async (req, res) => {
  const data = await authService.loginWithUsername(req.body || {});
  return sendAuthSuccess(res, data, 200);
});

const me = asyncHandler(async (req, res) => {
  if (!req.authUser) {
    return sendSuccess(res, { data: { user: null } }, 200);
  }
  return sendSuccess(res, { data: { user: req.authUser.toPublicJSON() } }, 200);
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, { data: { ok: true } }, 200);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.authUser._id, req.body || {});
  return sendSuccess(res, { data: { user } }, 200);
});

module.exports = {
  checkUsername,
  registerStart,
  registerVerify,
  loginStart,
  loginVerify,
  loginUsername,
  me,
  logout,
  updateProfile,
};
