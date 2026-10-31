'use strict';

/**
 * Adds the extra profile share after a feed list is already built.
 * The returned order keeps every existing short. An empty or failed
 * share leaves that list as it was.
 */

/**
 * @param {Console|null|undefined} logger
 * @param {unknown} error
 */
const logFailure = (logger, error) => {
  if (!logger || typeof logger.error !== 'function') return;
  try {
    logger.error(
      'shorts-reco profile share failed',
      error && error.message ? error.message : error
    );
  } catch (ignore) {
    // A broken logger must not change the feed.
  }
};

/**
 * @param {object} doc
 * @returns {object}
 */
const toItem = (doc) => ({
  shortId: doc.shortId,
  slot: 'profileHeat',
  anchorKey: null,
  type: doc.type,
  contentType: doc.contentType == null ? null : doc.contentType,
  movieId: doc.movieId == null ? null : doc.movieId,
  artistId: doc.artistId || null,
  musicKey: doc.musicKey || null,
  repeat: false,
});

/**
 * @param {unknown} exclude
 * @param {object[]} list
 * @returns {Set<string>}
 */
const takenIds = (exclude, list) => {
  const seen = new Set();
  if (exclude && typeof exclude.forEach === 'function') {
    exclude.forEach((id) => {
      if (typeof id === 'string' && id) seen.add(id);
    });
  }
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] && typeof list[i].shortId === 'string') seen.add(list[i].shortId);
  }
  return seen;
};

/**
 * @param {object[]|null|undefined} items
 * @param {{
 *   select?: Function|null,
 *   userId?: string|null,
 *   genreScores?: Record<string, number>,
 *   watches?: Map<string, object>,
 *   exclude?: Set<string>|string[],
 *   logger?: Console|null,
 * }} [input]
 * @returns {Promise<object[]>}
 */
const appendProfileHeat = async (items, input) => {
  const list = Array.isArray(items) ? items : [];
  const source = input || {};
  if (typeof source.select !== 'function') return list;

  try {
    const seen = takenIds(source.exclude, list);
    const extra = await source.select({
      userId: source.userId || null,
      genreScores: source.genreScores || {},
      watches: source.watches || new Map(),
      exclude: seen,
    });
    if (!Array.isArray(extra) || extra.length === 0) return list;

    const next = list.slice();
    for (let i = 0; i < extra.length; i += 1) {
      const doc = extra[i];
      if (!doc || typeof doc.shortId !== 'string' || seen.has(doc.shortId)) continue;
      seen.add(doc.shortId);
      next.push(toItem(doc));
    }
    return next;
  } catch (error) {
    logFailure(source.logger, error);
    return list;
  }
};

module.exports = {
  appendProfileHeat,
};
