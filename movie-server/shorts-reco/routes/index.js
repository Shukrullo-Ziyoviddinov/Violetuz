'use strict';

const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');

/**
 * Auth is optional. A missing user ignores events and receives a cold-start feed.
 * @param {{ postEvent: Function, getFeed: Function, getShelf: Function, authMiddleware?: Function }} handlers
 */
const createRouter = (handlers) => {
  const router = express.Router();
  const auth = handlers.authMiddleware
    || require('../../middleware/auth.middleware').optionalAuth;

  router.post('/events', auth, asyncHandler(handlers.postEvent));
  router.get('/feed', auth, asyncHandler(handlers.getFeed));
  router.get('/shelf', auth, asyncHandler(handlers.getShelf));
  return router;
};

module.exports = {
  createRouter,
};
