/** Feed — obuna asosida, katalog id (avto) bo‘yicha eng yangilar. */
const FEED_PER_TYPE_LIMIT = 2;
const FEED_PAGE_SIZE = 12;
const FEED_MAX_ITEMS = 50;

const FEED_TYPES = Object.freeze([
  'movie',
  'music',
  'klip',
  'konsert',
]);

module.exports = {
  FEED_PER_TYPE_LIMIT,
  FEED_PAGE_SIZE,
  FEED_MAX_ITEMS,
  FEED_TYPES,
};
