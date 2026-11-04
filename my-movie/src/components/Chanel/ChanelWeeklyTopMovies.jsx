import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useChannelWeeklyTopMovies } from '../../hooks/useChannelWeeklyTopMovies';
import ChanelContentCard from './ChanelContentCard';
import './ChanelWeeklyTopMovies.css';

/**
 * Kanal sahifasidagi haftaning top filmlari.
 * Tartib serverdan. Bo‘sh bo‘lsa blok chiqmaydi.
 * Raqam rasm emas.
 */
const ChanelWeeklyTopMovies = ({ channelId }) => {
  const { t } = useTranslation();
  const { movies, loading } = useChannelWeeklyTopMovies(channelId);
  const { allMovies, moviesLoading } = useMoviesApi();

  const cards = useMemo(() => {
    const byId = new Map((allMovies || []).map((movie) => [String(movie.id), movie]));
    const out = [];
    for (const row of movies) {
      const movie = byId.get(String(row.movieId));
      if (!movie) continue;
      if (String(movie.channelId || '') !== String(channelId || '')) continue;
      out.push({
        movie,
        rank: Number(row.rank) || out.length + 1,
      });
    }
    return out;
  }, [allMovies, movies, channelId]);

  const waiting = loading || (movies.length > 0 && moviesLoading && cards.length === 0);

  if (!waiting && cards.length === 0) return null;

  return (
    <div className="chanel-content-row">
      <h2 className="chanel-content-title">
        {t('movies.haftaningTopFilmlari', 'Haftaning top 10 filmlari')}
      </h2>
      <HorizontalScroll>
        {waiting
          ? Array.from({ length: 6 }, (_, index) => (
            <ChanelContentCard
              key={`channel-weekly-skel-${index}`}
              kind="movie"
              item={{ id: `sk-${index}` }}
              layout="row"
              forceSkeleton
            />
          ))
          : cards.map((entry) => (
            <ChanelContentCard
              key={`channel-weekly-${entry.movie.id}`}
              kind="movie"
              item={entry.movie}
              layout="row"
              rank={entry.rank}
            />
          ))}
      </HorizontalScroll>
    </div>
  );
};

export default ChanelWeeklyTopMovies;
