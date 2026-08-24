/**
 * Umumiy yil facet — kino / musiqa / klip / konsert / albom.
 * Exact: "2024 musiqalar" → { mode: 'exact', year: 2024 }
 * Recency: "yangi kliplar" → { mode: 'recency' }
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
  'yilda',
  'yildagi',
  'yildan',
  'yilgi',
  'dagi',
  'da',
  'chiqqan',
  'chiqgan',
  'chiqarilgan',
  'released',
  'year',
  'years',
];

/**
 * "to'plam" / collection — type intent, title emas.
 * Domain NOISE_WORDS ga qo'shish uchun umumiy.
 */
const COLLECTION_NOISE_WORDS = [
  'toplam',
  'toplami',
  'toplamlar',
  'toplamlari',
  'toplama',
  'collection',
  'collections',
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

  const words = q.split(/\s+/).filter(Boolean);
  if (words.some((w) => RECENCY_ALIASES.includes(w))) {
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

/**
 * Country/genre parse oldidan year ulash — barcha media domainlari uchun bir xil.
 * @param {string} rawQuery
 * @param {(cleanedQuery: string) => object} parseBaseFacets
 */
const attachYearFacet = (rawQuery, parseBaseFacets) => {
  const yearFacet = parseYearFacet(rawQuery);
  const queryWithoutYear = stripYearTokens(rawQuery, yearFacet);
  const base = parseBaseFacets(queryWithoutYear) || {};

  return {
    ...base,
    yearMode: yearFacet.mode,
    year: yearFacet.year,
    isYearSearch: yearFacet.isYearSearch,
    isFacetSearch: Boolean(base.isFacetSearch) || yearFacet.isYearSearch,
  };
};

module.exports = {
  parseYearFacet,
  stripYearTokens,
  attachYearFacet,
  emptyYearFacet,
  YEAR_RE,
  RECENCY_ALIASES,
  YEAR_NOISE_WORDS,
  COLLECTION_NOISE_WORDS,
};
