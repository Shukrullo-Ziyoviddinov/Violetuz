/**
 * Kino yil facet — so'rovdan year intent.
 * Exact: "2024 kinolari" → { mode: 'exact', year: 2024 }
 * Recency: "yangi kinolar" → { mode: 'recency' }
 *
 * Yillar ro'yxatlab yozilmaydi. Hardcode year yo'q.
 * Faqat engil string parse (1 marta / so'rov).
 */

const { normalizeText } = require('./searchFacetEngine');

/** Aniq yil: 1900–2099 */
const YEAR_RE = /\b((?:19|20)\d{2})\b/;

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Recency aliaslari — "yangi" / "oxirgi" / "latest".
 * "new" qo'shilmagan: "new york" kabi title bilan chalkashmasin.
 * Joriy yil Date bilan bu faylda hisoblanmaydi (sort keyin rank bosqichida).
 */
const RECENCY_ALIASES = [
  'yangi',
  'yangilar',
  'yangisi',
  'yangilari',
  'newest',
  'recent',
  'latest',
  'oxirgi',
  'oxirgilari',
  'songgi',
  'songgilar',
  'soʻnggi',
  "so'nggi",
];

/** Year yonidagi shovqin so'zlar */
const YEAR_NOISE_WORDS = [
  'yil',
  'yili',
  'yildagi',
  'yildan',
  'yilgi',
  'year',
  'years',
];

const emptyYearFacet = () => ({
  mode: null,
  year: null,
  isYearSearch: false,
});

/**
 * @param {string} rawQuery
 * @returns {{ mode: 'exact'|'recency'|null, year: number|null, isYearSearch: boolean }}
 */
const parseYearFacet = (rawQuery) => {
  const q = normalizeText(rawQuery);
  if (!q) return emptyYearFacet();

  // 1) Exact year — raqam bo'lsa ustun (masalan "yangi 2024" → exact 2024)
  const yearMatch = q.match(YEAR_RE);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    if (Number.isFinite(year)) {
      return {
        mode: 'exact',
        year,
        isYearSearch: true,
      };
    }
  }

  // 2) Recency — "yangi", "oxirgi", "latest"...
  const words = q.split(/\s+/).filter(Boolean);
  const hasRecency = words.some((w) => RECENCY_ALIASES.includes(w));
  if (hasRecency) {
    return {
      mode: 'recency',
      year: null,
      isYearSearch: true,
    };
  }

  return emptyYearFacet();
};

/**
 * Year / recency / "yil" tokenlarini querydan olib tashlaydi.
 * Country/genre/title parse oldidan chaqiriladi — chalkashmasin.
 */
const stripYearTokens = (rawQuery, yearFacet = null) => {
  let q = normalizeText(rawQuery);
  if (!q) return '';

  const facet = yearFacet || parseYearFacet(q);
  if (!facet.isYearSearch) return q;

  if (facet.mode === 'exact' && facet.year != null) {
    q = q.replace(new RegExp(`\\b${facet.year}\\b`, 'g'), ' ');
  } else {
    q = q.replace(YEAR_RE, ' ');
  }

  const stripList = [...YEAR_NOISE_WORDS, ...RECENCY_ALIASES].sort((a, b) => b.length - a.length);
  for (const token of stripList) {
    const normalized = normalizeText(token);
    if (!normalized) continue;
    q = q.replace(new RegExp(`\\b${escapeRegExp(normalized)}\\b`, 'g'), ' ');
  }

  return q.replace(/\s+/g, ' ').trim();
};

module.exports = {
  parseYearFacet,
  stripYearTokens,
  emptyYearFacet,
  YEAR_RE,
  RECENCY_ALIASES,
  YEAR_NOISE_WORDS,
};
