const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/auth.service');
const {
  setAuthCookie,
  clearAuthCookie,
  ensureDeviceKey,
  readDeviceKey,
} = require('../utils/authCookie');

const sendAuthSuccess = async (res, req, payload, status = 200) => {
  setAuthCookie(res, payload.token);
  const deviceKey = ensureDeviceKey(req, res);
  const userId = payload.user?.id;
  if (userId) {
    await authService.linkUserToDevice(deviceKey, userId);
  }
  /* Token faqat httpOnly cookie da — JS/localStorage ga berilmaydi */
  return sendSuccess(res, { data: { user: payload.user } }, status);
};

const checkUsername = asyncHandler(async (req, res) => {
  /** Faqat profil tahririda o‘z usernameini exclude qilish; yangi hisob/register da yo‘q */
  const excludeSelf =
    req.query.excludeSelf === '1' ||
    req.query.excludeSelf === 'true' ||
    req.query.excludeSelf === 'yes';
  const excludeUserId = excludeSelf ? req.authUser?._id || null : null;
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
  return sendAuthSuccess(res, req, data, 201);
});

const loginStart = asyncHandler(async (req, res) => {
  const data = await authService.startLogin(req.body || {});
  return sendSuccess(res, { data }, 200);
});

const loginVerify = asyncHandler(async (req, res) => {
  const data = await authService.verifyLogin(req.body || {});
  return sendAuthSuccess(res, req, data, 200);
});

const loginUsername = asyncHandler(async (req, res) => {
  const data = await authService.loginWithUsername(req.body || {});
  return sendAuthSuccess(res, req, data, 200);
});

const me = asyncHandler(async (req, res) => {
  if (!req.authUser) {
    return sendSuccess(res, { data: { user: null } }, 200);
  }
  const data = await authService.issueAuthSession(req.authUser);
  return sendAuthSuccess(res, req, data, 200);
});

const switchAccount = asyncHandler(async (req, res) => {
  const deviceKey = readDeviceKey(req);
  const data = await authService.switchAccountSession({
    userId: req.body?.userId,
    deviceKey,
  });
  return sendAuthSuccess(res, req, data, 200);
});

/** Qurilmadagi hisoblar ro‘yxati — manba server (device cookie) */
const listDeviceAccounts = asyncHandler(async (req, res) => {
  const deviceKey = readDeviceKey(req) || ensureDeviceKey(req, res);
  const activeUserId = req.authUser?._id ? String(req.authUser._id) : null;
  const data = await authService.listDeviceAccounts(deviceKey, activeUserId);
  return sendSuccess(res, { data }, 200);
});

const logout = asyncHandler(async (req, res) => {
  await authService.unlinkUserFromDevice(readDeviceKey(req), req.authUser?._id);
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
  switchAccount,
  listDeviceAccounts,
  logout,
  updateProfile,
};
