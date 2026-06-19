/**
 * movieId -> filterGenre, filterCountry
 * Hamma bo'limlardan: movies, koreaDrama, worldMovies, russianMovies va boshqalar
 */
import { allMovies } from '../data/movies';

export const getFilterByMovieId = (movieId) => {
  const movie = allMovies.find((m) => m.id === movieId);
  if (!movie) return { filterGenre: ['Drama'], filterCountry: 'USA' };

  let filterGenre = movie.filterGenre;
  if (!filterGenre && movie.genre?.uz) {
    filterGenre = Array.isArray(movie.genre.uz) ? movie.genre.uz : [movie.genre.uz];
  }
  if (!filterGenre && movie.typeCategory) {
    filterGenre = Array.isArray(movie.typeCategory) ? movie.typeCategory : [movie.typeCategory];
  }
  if (!filterGenre) filterGenre = ['Drama'];

  const filterCountry = movie.filterCountry || movie.description?.uz?.country || movie.description?.ru?.country || 'USA';

  return {
    filterGenre: Array.isArray(filterGenre) ? filterGenre : [filterGenre],
    filterCountry: String(filterCountry)
  };
};
