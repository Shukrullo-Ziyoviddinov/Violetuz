import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import FollowingButton from '../FollowingButton/FollowingButton';
import { useMusicApi } from '../../context/MusicApiContext';
import { useWeeklyTopArtists } from '../../hooks/useWeeklyTopArtists';
import '../TopArtist/TopArtist.css';

/**
 * Haftaning Top-10 artistlari (guest ham ko‘radi).
 * Data: /api/recommended-artists/weekly-top (rolling 7 days).
 */
const WeeklyTopArtist = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allArtists } = useMusicApi();
  const { items, loading } = useWeeklyTopArtists(10);

  const displayArtists = useMemo(() => {
    const byId = new Map((allArtists || []).map((a) => [String(a.id), a]));
    const out = [];
    for (const row of items) {
      const artist = byId.get(String(row.artistId));
      if (!artist) continue;
      out.push({
        ...artist,
        rank: row.rank || out.length + 1,
        score: row.score || 0,
      });
    }
    return out;
  }, [allArtists, items]);

  if (!loading && displayArtists.length === 0) return null;

  return (
    <div className="top-artist" aria-busy={loading || undefined}>
      <div className="top-artist-container">
        <div className="top-artist-header">
          <h2 className="top-artist-title">
            {t('music.haftaningTopArtistlari', 'Haftaning top 10 artistlari')}
          </h2>
        </div>
        <div className="top-artist-content">
          <HorizontalScroll scrollAmount={130}>
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={`weekly-top-artist-skel-${i}`}
                    className="top-artist-item"
                    aria-hidden="true"
                  >
                    <div className="top-artist-img-wrap" />
                  </div>
                ))
              : displayArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="top-artist-item"
                    onClick={() => navigate(`/music/artist/${artist.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/music/artist/${artist.id}`);
                      }
                    }}
                    aria-label={`${artist.rank}. ${artist.name}`}
                  >
                    <div className="top-artist-img-wrap">
                      <img
                        src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                        alt={artist.name}
                        className="top-artist-img"
                      />
                      <span className="top-artist-rank">{artist.rank}</span>
                    </div>
                    <p className="top-artist-name">{artist.name}</p>
                    <FollowingButton
                      artistId={artist.id}
                      entityType="artist"
                      wrapperClassName="top-artist-follow"
                      stopPropagation
                    />
                  </div>
                ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTopArtist;
