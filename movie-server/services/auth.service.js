const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const AuthOtp = require('../models/AuthOtp.model');
const { sendOtpEmail } = require('./brevoEmail.service');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { badRequest, notFound, createHttpError } = require('../utils/errors');

const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const checkUsernameAvailability = async (rawUsername) => {
  const username = normalizeUsername(rawUsername);
  if (!username) {
    throw badRequest('Username majburiy');
  }
  assertUsernameFormat(username);
  const usernameNormalized = username.toLowerCase();
  const taken = await isUsernameTaken(usernameNormalized);
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
  const token = signToken(user);
  return publicUserPayload(user, token);
};

const startLogin = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');

  if (!EMAIL_RE.test(cleanEmail)) {
    throw badRequest('Gmail manzil noto\'g\'ri');
  }
  if (!cleanPassword) {
    throw badRequest('Parol majburiy');
  }

  const user = await User.findOne({ emailNormalized: cleanEmail }).select(
    '+passwordHash'
  );
  if (!user) {
    throw createHttpError(401, 'Gmail yoki parol noto\'g\'ri');
  }

  const ok = await bcrypt.compare(cleanPassword, user.passwordHash);
  if (!ok) {
    throw createHttpError(401, 'Gmail yoki parol noto\'g\'ri');
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
  const token = signToken(user);
  return publicUserPayload(user, token);
};

module.exports = {
  checkUsernameAvailability,
  startRegister,
  verifyRegister,
  startLogin,
  verifyLogin,
};
