/**
 * Nom o'xshashligi (QATLAM 2).
 * Ball emas — faqat overlap; janr GATE engine da.
 * recommendation / home-feed ga ulanmaydi.
 *
 * @module movie-similar/services/titleSimilarityMatcher
 */

'use strict';

/** Tinish / maxsus belgilar — so'z ajratishdan oldin bo'shliqqa. */
const PUNCT_RE = /[^\p{L}\p{N}\s]+/gu;

/**
 * Umumiy shovqin so'zlar (uz/ru/en) — overlap dan chiqariladi.
 * Franshiza yoki Q3 ga daxli emas.
 */
const STOP_WORDS = new Set([
  // uz
  'kino',
  'film',
  'qism',
  'qismi',
  'seriya',
  'va',
  'bilan',
  'uchun',
  'the',
  // ru
  'фильм',
  'кино',
  'часть',
  'серия',
  'и',
  // en
  'a',
  'an',
  'of',
  'part',
  'movie',
  'episode',
]);

/**
 * @param {unknown} title
 * @returns {string[]}
 */
const normalizeTitle = (title) => {
  const raw = String(title || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(PUNCT_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!raw) return [];

  const words = [];
  for (const token of raw.split(' ')) {
    if (!token || STOP_WORDS.has(token)) continue;
    // Sof raqamli "2", "4" kabi — franshiza raqami shovqin; overlap uchun saqlanadi
    // (John Wick 4 vs John Wick 3 farqi uchun foydali)
    words.push(token);
  }
  return words;
};

const isPureNumber = (word) => /^\d+$/.test(word);

/**
 * Jaccard-uslubi: common / max(|A|, 1).
 * Faqat raqam (masalan "4") umumiy bo'lsa — 0 (yolg'on signal).
 * @param {unknown} titleA
 * @param {unknown} titleB
 * @returns {number} 0..1
 */
const titleOverlapScore = (titleA, titleB) => {
  const wordsA = normalizeTitle(titleA);
  const wordsB = normalizeTitle(titleB);
  if (!wordsA.length) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let common = 0;
  let meaningfulCommon = 0;
  for (const word of setA) {
    if (!setB.has(word)) continue;
    common += 1;
    if (!isPureNumber(word)) meaningfulCommon += 1;
  }
  if (meaningfulCommon === 0) return 0;
  return common / setA.size;
};

/**
 * Localized title: { uz, ru } yoki string.
 * Ikkala tildan eng yuqori overlap olinadi.
 * @param {unknown} titleA
 * @param {unknown} titleB
 * @returns {number} 0..1
 */
const localizedTitleOverlapScore = (titleA, titleB) => {
  if (typeof titleA === 'string' || typeof titleB === 'string') {
    return titleOverlapScore(titleA, titleB);
  }

  const a = titleA && typeof titleA === 'object' ? titleA : {};
  const b = titleB && typeof titleB === 'object' ? titleB : {};
  const pairs = [
    [a.uz, b.uz],
    [a.ru, b.ru],
    [a.uz, b.ru],
    [a.ru, b.uz],
  ];

  let best = 0;
  for (const [left, right] of pairs) {
    if (!left || !right) continue;
    const score = titleOverlapScore(left, right);
    if (score > best) best = score;
  }
  return best;
};

module.exports = {
  STOP_WORDS,
  normalizeTitle,
  titleOverlapScore,
  localizedTitleOverlapScore,
};
