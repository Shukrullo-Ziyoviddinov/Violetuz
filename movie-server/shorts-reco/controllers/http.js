'use strict';

const { validateFeedQuery } = require('../validators/feed.validator');
const { validateShelfQuery } = require('../validators/shelf.validator');

/**
 * @param {import('express').Request} req
 * @param {Function} getUserId
 * @returns {string|null}
 */
const userIdOf = (req, getUserId) => {
  const userId = getUserId(req);
  if (userId == null || userId === '') return null;
  return String(userId);
};

/**
 * @param {{
 *   ingest: Function,
 *   serveFeed: Function,
 *   serveShelf: Function,
 *   hydrate: Function,
 *   getUserId: Function,
 * }} deps
 */
const createHttpHandlers = (deps) => {
  const postEvent = async (req, res) => {
    const result = await deps.ingest({
      userId: userIdOf(req, deps.getUserId),
      body: req.body,
    });

    if (
      result.status === 'ignored' ||
      result.status === 'duplicate' ||
      result.status === 'stale' ||
      result.status === 'limited'
    ) {
      return res.status(204).end();
    }
    if (result.status === 'invalid') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event',
        errors: result.errors,
      });
    }
    if (result.status === 'not_found') {
      return res.status(404).json({ success: false, message: 'Short not found' });
    }

    return res.status(200).json({
      success: true,
      shortId: result.shortId,
      score: result.score,
    });
  };

  const getFeed = async (req, res) => {
    const query = validateFeedQuery(req.query);
    if (!query.ok) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feed query',
        errors: query.errors,
      });
    }

    const page = await deps.serveFeed({
      userId: userIdOf(req, deps.getUserId),
      sessionId: query.value.sessionId,
      position: query.value.position,
      limit: query.value.limit,
      focus: query.value.focus,
    });
    const items = await deps.hydrate(page.items);
    return res.status(200).json({
      success: true,
      sessionId: page.sessionId,
      frozenUntil: page.frozenUntil,
      items,
    });
  };

  const getShelf = async (req, res) => {
    const query = validateShelfQuery(req.query);
    if (!query.ok) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shelf query',
        errors: query.errors,
      });
    }

    const page = await deps.serveShelf({
      userId: userIdOf(req, deps.getUserId),
      type: query.value.type,
      block: query.value.block,
      limit: query.value.limit,
    });
    return res.status(200).json({
      success: true,
      type: page.type,
      block: page.block,
      items: page.items,
    });
  };

  return { postEvent, getFeed, getShelf };
};

module.exports = {
  createHttpHandlers,
};
