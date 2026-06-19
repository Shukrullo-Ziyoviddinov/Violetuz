/**
 * Ko'rgan kinolar asosida tavsiyalar - typeCategory, filterGenre, filterCountry
 * Backend qo'shilganda fetchRecommendations() ishlatiladi
 */

const toArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

export const getRecommendations = (allMovies, viewedItems, limit = 12) => {
  if (!allMovies?.length) return [];

  const viewedIds = new Set((viewedItems || []).map((i) => i.id));

  if (!viewedItems?.length) {
    const shuffled = [...allMovies].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  const genres = new Set();
  const countries = new Set();
  const types = new Set();
  viewedItems.forEach((v) => {
    toArray(v.filterGenre).forEach((g) => genres.add(g));
    if (v.filterCountry) countries.add(v.filterCountry);
    toArray(v.typeCategory).forEach((t) => types.add(t));
  });

  const scored = allMovies
    .filter((m) => !viewedIds.has(m.id))
    .map((m) => {
      let score = 0;
      const mGenres = toArray(m.filterGenre);
      const mTypes = toArray(m.typeCategory);
      mGenres.forEach((g) => {
        if (genres.has(g)) score += 2;
      });
      if (m.filterCountry && countries.has(m.filterCountry)) score += 1.5;
      mTypes.forEach((t) => {
        if (types.has(t)) score += 1;
      });
      return { movie: m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit).map((x) => x.movie);
  if (top.length < limit) {
    const rest = allMovies
      .filter((m) => !viewedIds.has(m.id) && !top.includes(m))
      .sort(() => Math.random() - 0.5)
      .slice(0, limit - top.length);
    return [...top, ...rest];
  }
  return top;
};
