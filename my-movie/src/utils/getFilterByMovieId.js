/**
 * movieId -> filterGenre, filterCountry
 * moviesList API/DB dan beriladi
 */
export const getFilterByMovieId = (movieId, moviesList = []) => {
  const movies = Array.isArray(moviesList) ? moviesList : [];
  const movie = movies.find((m) => m.id === movieId || String(m.id) === String(movieId));
  if (!movie) return { filterGenre: ['Drama'], filterCountry: 'USA' };

  let filterGenre = movie.filterGenre;
  if (!filterGenre && movie.genre?.uz) {
    filterGenre = Array.isArray(movie.genre.uz) ? movie.genre.uz : [movie.genre.uz];
  }
  if (!filterGenre && movie.typeCategory) {
    filterGenre = Array.isArray(movie.typeCategory) ? movie.typeCategory : [movie.typeCategory];
  }
  if (!filterGenre) filterGenre = ['Drama'];

  const filterCountry =
    movie.filterCountry || movie.description?.uz?.country || movie.description?.ru?.country || 'USA';

  return {
    filterGenre: Array.isArray(filterGenre) ? filterGenre : [filterGenre],
    filterCountry: String(filterCountry),
  };
};
