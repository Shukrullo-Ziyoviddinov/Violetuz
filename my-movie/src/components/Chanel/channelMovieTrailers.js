import { sortByUploadedAtDesc } from './sortByUploadedAt';

export const channelMovieTrailers = (movies, channelId) => {
  if (channelId == null || channelId === '') return [];
  const channelMovies = (movies || []).filter((movie) => String(movie.channelId ?? '') === String(channelId));
  return sortByUploadedAtDesc(channelMovies).flatMap((movie) => {
    const seen = new Set();
    return (Array.isArray(movie.trailersVideo) ? movie.trailersVideo : []).flatMap((trailer) => {
      const sources = typeof trailer?.trailers === 'string' ? [trailer.trailers] : Object.values(trailer?.trailers || {});
      if (trailer?.id == null || !sources.some((source) => typeof source === 'string' && source.trim())) return [];
      const key = `${movie.id}-${trailer.id}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ ...trailer, trillerimg: trailer.trillerimg || movie.homeImg?.uz || movie.homeImg?.ru || '', movieId: movie.id, movieTitle: movie.title, key }];
    });
  });
};
