import { allMovies } from '../data/movies';
import { matchId } from '../dataMusic/musicDataUtils';

/**
 * Kino shorts: movieId orqali title, homeImg, rating, specs kinodan olinadi.
 */
export function resolveShortsMovieMeta(shortItem) {
  if (!shortItem?.movieId) return shortItem;

  const movie = allMovies.find((m) => matchId(m.id, shortItem.movieId));
  if (!movie) return shortItem;

  return {
    ...shortItem,
    title: movie.title,
    homeImg: movie.homeImg,
    rating: movie.rating,
    specs: movie.specs,
  };
}
