import { matchId } from './musicDataUtils';

/**
 * Kino shorts: movieId orqali title, homeImg, rating, specs kinodan olinadi.
 */
export function resolveShortsMovieMeta(shortItem, moviesList = []) {
  if (!shortItem?.movieId) return shortItem;

  const movies = Array.isArray(moviesList) ? moviesList : [];
  const movie = movies.find((m) => matchId(m.id, shortItem.movieId));
  if (!movie) return shortItem;

  return {
    ...shortItem,
    title: movie.title,
    homeImg: movie.homeImg,
    rating: movie.rating,
    specs: movie.specs,
    filterGenre: movie.filterGenre || shortItem.filterGenre,
    filterCountry: movie.filterCountry || shortItem.filterCountry,
  };
}
