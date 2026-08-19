/** Polimorf komment target turlari */
const COMMENT_TYPES = Object.freeze([
  'movie',
  'triller',
  'klip',
  'konsert',
  'shorts',
  'musicShorts',
]);

const MAX_COMMENT_LENGTH = 2000;
const REPLIES_PAGE_SIZE = 5;

module.exports = {
  COMMENT_TYPES,
  MAX_COMMENT_LENGTH,
  REPLIES_PAGE_SIZE,
};
