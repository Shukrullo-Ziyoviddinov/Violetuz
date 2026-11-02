const genreValues = (genre) => {
  const raw = genre?.filterGenre;
  if (Array.isArray(raw)) {
    return raw.map((value) => String(value || '').trim()).filter(Boolean);
  }
  if (raw == null || raw === '') return [];
  return [String(raw).trim()].filter(Boolean);
};

export const movieMatchesGenre = (movie, genre) => {
  const values = genreValues(genre);
  if (!values.length) return false;
  const movieValues = Array.isArray(movie?.filterGenre)
    ? movie.filterGenre.map((value) => String(value))
    : [];
  return values.some((value) => movieValues.includes(value));
};

export const channelMovieGenres = (allGenres, movies) => {
  const used = new Set(
    (movies || []).flatMap((movie) => (
      Array.isArray(movie?.filterGenre) ? movie.filterGenre.map((value) => String(value)) : []
    )),
  );
  return (allGenres || []).filter((genre) => genreValues(genre).some((value) => used.has(value)));
};
