// TODO: Backend ulash - bu yerda API chaqiruv qo'shiladi

/**
 * Instagram-style shorts recommendation algorithm.
 * @param {Array} allShorts - All available shorts
 * @param {Array} watchHistory - [{ shortId, filterGenre, filterCountry, watchedAt }]
 * @param {number} limit - Max recommendations to return
 * @returns {Array} Recommended shorts (excludes already watched)
 */
export const getShortsRecommendations = (allShorts, watchHistory, limit = 20) => {
  if (!allShorts?.length) return [];

  // Count genre+country pairs user watched 2+ times = interests
  const pairCounts = {};
  for (const entry of watchHistory) {
    const genres = Array.isArray(entry.filterGenre) ? entry.filterGenre : [];
    const country = entry.filterCountry || '';
    for (const g of genres) {
      const key = `${g}|${country}`;
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    }
  }
  const interests = Object.entries(pairCounts)
    .filter(([, count]) => count >= 2)
    .map(([key]) => key);

  const watchedIds = new Set(watchHistory.map((e) => e.shortId));

  // Score each short: prioritize both genre+country match
  const scored = allShorts
    .filter((s) => !watchedIds.has(s.id))
    .map((short) => {
      const genres = Array.isArray(short.filterGenre) ? short.filterGenre : [];
      const country = short.filterCountry || '';
      let score = 0;
      for (const g of genres) {
        const key = `${g}|${country}`;
        if (interests.includes(key)) score += 2; // both genre+country match
        else if (interests.some((k) => k.startsWith(g + '|'))) score += 1; // genre match
        else if (interests.some((k) => k.endsWith('|' + country))) score += 1; // country match
      }
      return { short, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ short }) => short);

  // If no interest-based matches, return unwatched shorts
  const unwatched = allShorts.filter((s) => !watchedIds.has(s.id));
  const result = scored.length > 0 ? scored : unwatched;

  return result.slice(0, limit);
};

const shuffleWithSeed = (arr, seed) => {
  const a = [...arr];
  let s = 0;
  for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const SHORTS_PER_BLOCK = 12;

/**
 * Har bir Home blok uchun boshqa videolar - hech biri takrorlanmaydi.
 * Aralash algoritm: barcha shortlar aralashib, 3 ta blokka bo'linadi.
 * @param {Array} allShorts - Barcha shortlar (horror qo'shilgan)
 * @param {Array} watchHistory - Watch history
 * @param {number} blockIndex - 0=primary, 1=secondary, 2=tertiary
 * @returns {Array} 12 ta short
 */
export const getShortsForHomeBlock = (allShorts, watchHistory = [], blockIndex = 0) => {
  const list = allShorts || [];
  const shuffled = shuffleWithSeed(list, `home-shorts-block-${blockIndex}`);
  const start = blockIndex * SHORTS_PER_BLOCK;
  const chunk = shuffled.slice(start, start + SHORTS_PER_BLOCK);
  if (chunk.length >= SHORTS_PER_BLOCK) return chunk;
  const usedIds = new Set(chunk.map((s) => s.id));
  const rest = shuffled.filter((s) => !usedIds.has(s.id));
  return [...chunk, ...rest].slice(0, SHORTS_PER_BLOCK);
};

/** @deprecated getShortsForHomeBlock ishlatiladi */
export const getShortsForHome = (allShorts, watchHistory = []) =>
  getShortsForHomeBlock(allShorts, watchHistory, 0);
