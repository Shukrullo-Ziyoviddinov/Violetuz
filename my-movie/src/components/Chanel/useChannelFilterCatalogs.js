import { useMemo } from 'react';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { channelOnly } from './channelFilterLogic';

export default function useChannelFilterCatalogs(channelId) {
  const { allMovies } = useMoviesApi();
  const { allMusic, allClips, allAlbums, allConcerts } = useMusicApi();
  return useMemo(() => ({
    movie: channelOnly(allMovies, channelId),
    music: channelOnly(allMusic, channelId),
    klip: channelOnly(allClips, channelId),
    album: channelOnly(allAlbums, channelId),
    konsert: channelOnly(allConcerts, channelId),
  }), [channelId, allMovies, allMusic, allClips, allAlbums, allConcerts]);
}
