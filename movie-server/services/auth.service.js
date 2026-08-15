const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const AuthOtp = require('../models/AuthOtp.model');
const { sendOtpEmail } = require('./brevoEmail.service');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { badRequest, notFound, createHttpError } = require('../utils/errors');
const { syncAdminRole } = require('../utils/adminRole');
const { assertR2MediaUrl } = require('../utils/assertR2MediaUrl');

const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIO_MAX_CHARS = 65;

const normalizeUsername = (raw) => String(raw || '').trim().replace(/^@+/, '');
const normalizeEmail = (raw) => String(raw || '').trim().toLowerCase();

const hashValue = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

const generateOtpCode = () => String(crypto.randomInt(100000, 999999));

const signToken = (user) =>
  jwt.sign(
    { sub: String(user._id), username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const publicUserPayload = (user, token) => ({
  token,
  user: user.toPublicJSON(),
});

/** Sync ADMIN_EMAILS/USERNAMES → role, then issue JWT + public user */
const issueAuthSession = async (user) => {
  const synced = await syncAdminRole(user);
  const token = signToken(synced);
  return publicUserPayload(synced, token);
};

const assertUsernameFormat = (username) => {
  if (username.includes('-')) {
    throw badRequest('- belgi mumkun emas');
  }
  if (!USERNAME_RE.test(username)) {
    throw badRequest('Username 3–30 belgi: harf, raqam, _ yoki .');
  }
};

const isUsernameTaken = async (usernameNormalized, excludeUserId = null) => {
  const query = { usernameNormalized };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const existing = await User.findOne(query).select('_id').lean();
  return Boolean(existing);
};

const checkUsernameAvailability = async (rawUsername, excludeUserId = null) => {
  const username = normalizeUsername(rawUsername);
  if (!username) {
    throw badRequest('Username majburiy');
  }
  assertUsernameFormat(username);
  const usernameNormalized = username.toLowerCase();
  const taken = await isUsernameTaken(usernameNormalized, excludeUserId);
  return {
    username,
    available: !taken,
    message: taken ? 'Bu username band' : 'Username bo\'sh',
  };
};

const replaceOtp = async ({
  emailNormalized,
  purpose,
  codeHash,
  pending,
  userId,
}) => {
  await AuthOtp.deleteMany({ emailNormalized, purpose });
  return AuthOtp.create({
    emailNormalized,
    purpose,
    codeHash,
    pending: pending || {},
    userId: userId || null,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  });
};

const startRegister = async ({ name, username, email, password }) => {
  const trimmedName = String(name || '').trim();
  const cleanUsername = normalizeUsername(username);
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');

  if (!trimmedName || trimmedName.length < 2) {
    throw badRequest('Ism yoki tahallus majburiy');
  }
  assertUsernameFormat(cleanUsername);
  if (!EMAIL_RE.test(cleanEmail)) {
    throw badRequest('Gmail manzil noto\'g\'ri');
  }
  if (cleanPassword.length < 6) {
    throw badRequest('Parol kamida 6 belgi bo\'lishi kerak');
  }

  const usernameNormalized = cleanUsername.toLowerCase();

  if (await isUsernameTaken(usernameNormalized)) {
    throw createHttpError(409, 'Bu username band', { field: 'username' });
  }

  const emailTaken = await User.findOne({ emailNormalized: cleanEmail })
    .select('_id')
    .lean();
  if (emailTaken) {
    throw createHttpError(409, 'Bu gmail allaqachon ro\'yxatdan o\'tgan', {
      field: 'email',
    });
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 10);
  const code = generateOtpCode();
  await replaceOtp({
    emailNormalized: cleanEmail,
    purpose: 'register',
    codeHash: hashValue(code),
    pending: {
      name: trimmedName,
      username: cleanUsername,
      usernameNormalized,
      email: cleanEmail,
      passwordHash,
    },
  });

  await sendOtpEmail({
    toEmail: cleanEmail,
    toName: trimmedName,
    code,
    purpose: 'register',
  });

  return {
    email: cleanEmail,
    purpose: 'register',
    message: 'Tasdiqlash kodi gmailga yuborildi',
  };
};

const verifyRegister = async ({ email, code }) => {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = String(code || '').trim();
  if (!cleanEmail || !/^\d{6}$/.test(cleanCode)) {
    throw badRequest('Kod 6 raqamdan iborat bo\'lishi kerak');
  }

  const otp = await AuthOtp.findOne({
    emailNormalized: cleanEmail,
    purpose: 'register',
  });
  if (!otp) {
    throw notFound('Tasdiqlash sessiyasi topilmadi. Qaytadan urinib ko\'ring');
  }
  if (otp.expiresAt.getTime() < Date.now()) {
    await otp.deleteOne();
    throw badRequest('Kod muddati tugagan');
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw badRequest('Juda ko\'p noto\'g\'ri urinish');
  }

  if (otp.codeHash !== hashValue(cleanCode)) {
    otp.attempts += 1;
    await otp.save();
    throw badRequest('Kod noto\'g\'ri');
  }

  const { name, username, usernameNormalized, email: pendingEmail, passwordHash } =
    otp.pending || {};

  if (!name || !username || !usernameNormalized || !passwordHash) {
    await otp.deleteOne();
    throw badRequest('Ro\'yxatdan o\'tish ma\'lumoti yo\'qolgan. Qaytadan boshlang');
  }

  if (await isUsernameTaken(usernameNormalized)) {
    await otp.deleteOne();
    throw createHttpError(409, 'Bu username band', { field: 'username' });
  }

  const user = await User.create({
    name,
    username,
    usernameNormalized,
    email: pendingEmail || cleanEmail,
    emailNormalized: cleanEmail,
    passwordHash,
  });

  await otp.deleteOne();
  return issueAuthSession(user);
};

const startLogin = async ({ email }) => {
  const cleanEmail = normalizeEmail(email);

  if (!EMAIL_RE.test(cleanEmail)) {
    throw badRequest('Gmail manzil noto\'g\'ri');
  }

  const user = await User.findOne({ emailNormalized: cleanEmail });
  if (!user) {
    throw createHttpError(401, 'Bu gmail bilan hisob topilmadi');
  }

  const code = generateOtpCode();
  await replaceOtp({
    emailNormalized: cleanEmail,
    purpose: 'login',
    codeHash: hashValue(code),
    userId: user._id,
  });

  await sendOtpEmail({
    toEmail: user.email,
    toName: user.name,
    code,
    purpose: 'login',
  });

  return {
    email: user.email,
    purpose: 'login',
    message: 'Kirish kodi gmailga yuborildi',
  };
};

const loginWithUsername = async ({ username, password }) => {
  const cleanUsername = normalizeUsername(username);
  const cleanPassword = String(password || '');

  if (!cleanUsername || !cleanPassword) {
    throw createHttpError(401, 'Parol yoki username xato');
  }

  const user = await User.findOne({
    usernameNormalized: cleanUsername.toLowerCase(),
  }).select('+passwordHash');

  if (!user) {
    throw createHttpError(401, 'Parol yoki username xato');
  }

  const ok = await bcrypt.compare(cleanPassword, user.passwordHash);
  if (!ok) {
    throw createHttpError(401, 'Parol yoki username xato');
  }

  return issueAuthSession(user);
};

const verifyLogin = async ({ email, code }) => {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = String(code || '').trim();
  if (!cleanEmail || !/^\d{6}$/.test(cleanCode)) {
    throw badRequest('Kod 6 raqamdan iborat bo\'lishi kerak');
  }

  const otp = await AuthOtp.findOne({
    emailNormalized: cleanEmail,
    purpose: 'login',
  });
  if (!otp) {
    throw notFound('Kirish sessiyasi topilmadi. Qaytadan urinib ko\'ring');
  }
  if (otp.expiresAt.getTime() < Date.now()) {
    await otp.deleteOne();
    throw badRequest('Kod muddati tugagan');
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw badRequest('Juda ko\'p noto\'g\'ri urinish');
  }

  if (otp.codeHash !== hashValue(cleanCode)) {
    otp.attempts += 1;
    await otp.save();
    throw badRequest('Kod noto\'g\'ri');
  }

  const user = await User.findById(otp.userId);
  if (!user) {
    await otp.deleteOne();
    throw notFound('Foydalanuvchi topilmadi');
  }

  await otp.deleteOne();
  return issueAuthSession(user);
};

const updateProfile = async (userId, { name, username, bio, avatar }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw notFound('Foydalanuvchi topilmadi');
  }

  const trimmedName = String(name ?? user.name).trim();
  if (!trimmedName || trimmedName.length < 2) {
    throw badRequest('Name majburiy (kamida 2 belgi)');
  }
  if (trimmedName.length > 80) {
    throw badRequest('Name juda uzun');
  }

  const cleanUsername = normalizeUsername(username ?? user.username);
  assertUsernameFormat(cleanUsername);
  const usernameNormalized = cleanUsername.toLowerCase();

  if (await isUsernameTaken(usernameNormalized, user._id)) {
    throw createHttpError(409, 'Bu username band', { field: 'username' });
  }

  let cleanBio = bio !== undefined ? String(bio ?? '') : user.bio || '';
  if (cleanBio.length > BIO_MAX_CHARS) {
    throw badRequest(`Bio maksimal ${BIO_MAX_CHARS} belgi`);
  }

  const cleanAvatar = assertR2MediaUrl(avatar, {
    field: 'avatar',
    allowEmpty: true,
    allowLegacyRelative: false,
    requirePrefix: 'avatars/',
    maxLength: 500,
  });

  user.name = trimmedName;
  user.username = cleanUsername;
  user.usernameNormalized = usernameNormalized;
  user.bio = cleanBio;
  if (cleanAvatar !== undefined) {
    user.avatar = cleanAvatar;
  }
  await user.save();

  return user.toPublicJSON();
};

module.exports = {
  checkUsernameAvailability,
  startRegister,
  verifyRegister,
  startLogin,
  verifyLogin,
  loginWithUsername,
  updateProfile,
};
