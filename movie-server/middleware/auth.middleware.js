const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { JWT_SECRET } = require('../config/env');
const { AUTH_COOKIE_NAME } = require('../utils/authCookie');
const { createHttpError } = require('../utils/errors');
const { syncAdminRole } = require('../utils/adminRole');

const readToken = (req) => {
  const fromCookie = req.cookies?.[AUTH_COOKIE_NAME];
  if (fromCookie) return fromCookie;

  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
};

/** Cookie / Bearer → req.authUser (yo‘q bo‘lsa null) */
const optionalAuth = async (req, _res, next) => {
  try {
    const token = readToken(req);
    if (!token) {
      req.authUser = null;
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    req.authUser = user ? await syncAdminRole(user) : null;
    return next();
  } catch {
    req.authUser = null;
    return next();
  }
};

const requireAuth = async (req, _res, next) => {
  try {
    const token = readToken(req);
    if (!token) {
      return next(createHttpError(401, 'Avval hisobga kiring'));
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(createHttpError(401, 'Sessiya yaroqsiz'));
    }

    req.authUser = await syncAdminRole(user);
    return next();
  } catch {
    return next(createHttpError(401, 'Sessiya muddati tugagan'));
  }
};

/** requireAuth + role === admin */
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.authUser || req.authUser.role !== 'admin') {
      return next(createHttpError(403, 'Admin huquqi kerak'));
    }
    return next();
  });
};

module.exports = {
  optionalAuth,
  requireAuth,
  requireAdmin,
};
