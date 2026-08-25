/**
 * SearchPoiscHistory — model / service / routes tekshiruv (Mongo shart emas).
 * node movie-server/scripts/verifySearchPoiscHistory.js
 */

const SearchPoiscHistory = require('../models/SearchPoiscHistory.model');
const {
  SEARCH_POISC_HISTORY_TYPES,
  MAX_HISTORY_PER_USER,
  assertType,
  normalizeType,
  normalizeItemId,
} = require('../services/searchPoiscHistory.service');
const {
  validateSearchPoiscHistoryListQuery,
  validateSearchPoiscHistoryItemBody,
} = require('../middleware/searchPoiscHistory.validators');

let fail = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) {
    fail += 1;
    console.log('FAIL:', name, extra);
  } else {
    console.log('OK  :', name, extra);
  }
};

// Model
ok(
  'collection name',
  SearchPoiscHistory.collection?.collectionName === 'searchPoiscHistory' ||
    SearchPoiscHistory.schema?.options?.collection === 'searchPoiscHistory'
);
ok(
  'types B1 only',
  SEARCH_POISC_HISTORY_TYPES.length === 4 &&
    SEARCH_POISC_HISTORY_TYPES.includes('movie') &&
    SEARCH_POISC_HISTORY_TYPES.includes('music') &&
    SEARCH_POISC_HISTORY_TYPES.includes('klip') &&
    SEARCH_POISC_HISTORY_TYPES.includes('konsert') &&
    !SEARCH_POISC_HISTORY_TYPES.includes('album') &&
    !SEARCH_POISC_HISTORY_TYPES.includes('actor')
);
ok('max history', MAX_HISTORY_PER_USER === 50);

// normalize / assert
ok('clip → klip', normalizeType('clip') === 'klip');
ok('concert → konsert', normalizeType('CONCERT') === 'konsert');
ok('movie stays', assertType('movie') === 'movie');
ok('music stays', assertType('Music') === 'music');

let threw = false;
try {
  assertType('album');
} catch (e) {
  threw = e.status === 400;
}
ok('album rejected', threw);

threw = false;
try {
  normalizeItemId('');
} catch (e) {
  threw = e.status === 400;
}
ok('empty id rejected', threw);
ok('id string', normalizeItemId(42) === '42');

// Schema: query field yo‘q
const paths = Object.keys(SearchPoiscHistory.schema.paths);
ok('no query field', !paths.includes('query') && !paths.includes('searchQuery'));
ok('has clickedAt', paths.includes('clickedAt'));
ok('has snapshot', paths.includes('snapshot'));
ok('has userId', paths.includes('userId'));

// Validators (mock req)
const runMw = (mw, req) =>
  new Promise((resolve) => {
    mw(req, {}, (err) => resolve(err || null));
  });

(async () => {
  const badLimit = await runMw(validateSearchPoiscHistoryListQuery, {
    query: { limit: '0' },
  });
  ok('limit 0 rejected', Boolean(badLimit && badLimit.status === 400));

  const goodLimit = await runMw(validateSearchPoiscHistoryListQuery, {
    query: { limit: '20' },
  });
  ok('limit 20 ok', goodLimit == null);

  const badBody = await runMw(validateSearchPoiscHistoryItemBody, {
    body: { type: 'movie' },
    query: {},
  });
  ok('missing id rejected', Boolean(badBody && badBody.status === 400));

  const clipBody = { body: { id: '101', type: 'clip' }, query: {} };
  const clipErr = await runMw(validateSearchPoiscHistoryItemBody, clipBody);
  ok('clip body ok', clipErr == null && clipBody.body.type === 'klip');

  // Routes file + index mount
  const historyRouter = require('../routes/searchPoiscHistory.routes');
  ok('history router export', typeof historyRouter === 'function');

  const fs = require('fs');
  const path = require('path');
  const indexSrc = fs.readFileSync(path.join(__dirname, '../routes/index.js'), 'utf8');
  ok(
    'routes mounted /search-poisc-history',
    indexSrc.includes("'/search-poisc-history'") &&
      indexSrc.includes('searchPoiscHistoryRoutes')
  );

  console.log(`\nTOTAL FAILS: ${fail}`);
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
