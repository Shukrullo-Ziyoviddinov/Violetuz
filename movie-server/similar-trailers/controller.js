/**
 * .similar-trailers-list so‘rovlari.
 *
 * @module similar-trailers/controller
 */

'use strict';

const { serveSimilarTrailers } = require('./serve.service');
const { sendSuccess } = require('../utils/response');

const sendList = (res, items) => {
  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getSimilarTrailers = async (req, res) => {
  const items = await serveSimilarTrailers({
    userId: req.authUser?._id,
  });
  sendList(res, items);
};

const postGuestSimilarTrailers = async (req, res) => {
  if (req.authUser) {
    const items = await serveSimilarTrailers({ userId: req.authUser._id });
    sendList(res, items);
    return;
  }

  const items = await serveSimilarTrailers({
    localHistory: req.body?.localHistory,
  });
  sendList(res, items);
};

module.exports = {
  getSimilarTrailers,
  postGuestSimilarTrailers,
};
