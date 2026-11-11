/**
 * Odam va kanal username qidiruvi.
 * Faqat usernameNormalized ballanadi. Kino, musiqa va aktyor algoritmiga ulanmaydi.
 *
 * Tartib: to'liq mos > boshidan mos > ichida qatnashgan.
 * Bir xil turda qisqaroq qo'shimcha yuqoriroq turadi.
 */

const MIN_QUERY_LENGTH = 2;
const EXACT_SCORE = 1000;
const PREFIX_BASE = 800;
const CONTAINS_BASE = 400;

const normalizeIdentityQuery = (raw) =>
  String(raw || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '');

const identityUsername = (item) => {
  const stored = String(item?.usernameNormalized || '').trim().toLowerCase();
  if (stored) return stored;
  return normalizeIdentityQuery(item?.username);
};

const usernameMatchScore = (query, username) => {
  if (!query || !username || query.length < MIN_QUERY_LENGTH) return 0;
  if (username === query) return EXACT_SCORE;
  const extra = username.length - query.length;
  if (extra < 1) return 0;
  if (username.startsWith(query)) return PREFIX_BASE - extra;
  if (username.includes(query)) return CONTAINS_BASE - extra;
  return 0;
};

/**
 * @param {Array<object>} items
 * @param {string} query
 * @returns {{ items: Array<object>, topScore: number }}
 */
const rankIdentityUsernames = (items, query) => {
  const q = normalizeIdentityQuery(query);
  if (q.length < MIN_QUERY_LENGTH) return { items: [], topScore: 0 };

  const scored = [];
  for (const item of Array.isArray(items) ? items : []) {
    const username = identityUsername(item);
    const score = usernameMatchScore(q, username);
    if (score > 0) scored.push({ item, score, username });
  }

  scored.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

  return {
    items: scored.map((row) => row.item),
    topScore: scored.length ? scored[0].score : 0,
  };
};

module.exports = {
  MIN_QUERY_LENGTH,
  rankIdentityUsernames,
  usernameMatchScore,
  normalizeIdentityQuery,
};
