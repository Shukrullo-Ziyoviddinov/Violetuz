'use strict';

const config = require('../../config');

/**
 * @param {unknown} left
 * @param {unknown} right
 */
const sameId = (left, right) => left != null && right != null && String(left) === String(right);

/**
 * Items already placed in the 10-slot block the next short would join.
 * @param {object[]} carried
 * @param {object[]} picked
 * @param {number} prefixLength
 */
const currentBlock = (carried, picked, prefixLength) => {
  const all = carried.concat(picked);
  const blockStart = prefixLength - carried.length;
  const candidateAt = prefixLength + picked.length;
  const windowStart = Math.floor(candidateAt / config.slotsPerCycle) * config.slotsPerCycle;
  return all.filter((_, index) => blockStart + index >= windowStart);
};

/**
 * Caps apply inside each 10. Back-to-back rules apply across the frozen prefix too.
 * @param {object[]} picked
 * @param {object} candidate
 * @param {{ carried?: object[], prefixLength?: number, prefixTail?: object|null }} [ctx]
 */
const accepts = (picked, candidate, ctx) => {
  if (!candidate) return false;
  const state = ctx || {};
  const carried = state.carried || [];
  const block = currentBlock(carried, picked, state.prefixLength || 0);

  if (candidate.movieId != null) {
    const movieCount = block.filter((item) => sameId(item.movieId, candidate.movieId)).length;
    if (movieCount >= config.maxSameMoviePer10) return false;
  }
  if (candidate.artistId) {
    const artistCount = block.filter((item) => item.artistId === candidate.artistId).length;
    if (artistCount >= config.maxSameArtistPer10) return false;
  }

  const history = [];
  if (!carried.length && state.prefixTail) history.push(state.prefixTail);
  else history.push(...carried);
  history.push(...picked);
  const prev = history[history.length - 1];
  if (!prev) return true;
  if (candidate.musicKey && prev.musicKey === candidate.musicKey) return false;
  if (candidate.artistId && prev.artistId === candidate.artistId) return false;
  if (candidate.movieId == null) return true;

  let run = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (sameId(history[i].movieId, candidate.movieId)) run += 1;
    else break;
  }
  return run < config.maxConsecutiveSameMovie;
};

module.exports = {
  currentBlock,
  accepts,
};
