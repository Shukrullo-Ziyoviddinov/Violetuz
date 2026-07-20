import { resolveShortsMovieMeta } from './resolveShortsMovieMeta';
import { resolveShortsMusics } from './resolveShortsMusics';

/**
 * Kino shorts katalogi: movieId → title/homeImg/...; musics ref → audio/video meta.
 * musicList / clipList / concertList ixtiyoriy (berilmasa musics faqat ref qoladi).
 */
export function resolveShortsWithMovies(
  rawShorts = [],
  moviesList = [],
  musicList = [],
  clipList = [],
  concertList = []
) {
  const list = Array.isArray(rawShorts) ? rawShorts : [];

  return list.map((item) => {
    let next = item.movieId != null ? resolveShortsMovieMeta(item, moviesList) : { ...item };
    if (item.musics) {
      const musics = resolveShortsMusics(item.musics, musicList, clipList, concertList);
      if (musics) next = { ...next, musics };
    }
    return next;
  });
}
