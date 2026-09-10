import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useMusicApi } from '../../context/MusicApiContext';
import { useTopArtists } from '../../hooks/useTopArtists';
import './TopArtist.css';

/**
 * Global Top-10 artists (same for everyone).
 * Data: /api/recommended-artists/top — not RecommendedArtists carousel.
 */
const TopArtist = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allArtists } = useMusicApi();
  const { items, loading } = useTopArtists(10);

  const displayArtists = useMemo(() => {
    const byId = new Map(
      (allArtists || []).map((a) => [String(a.id), a])
    );
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
            {t('music.topArtistlar', 'Top 10 artistlar')}
          </h2>
        </div>
        <div className="top-artist-content">
          <HorizontalScroll scrollAmount={130}>
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={`top-artist-skel-${i}`}
                    className="top-artist-item"
                    aria-hidden="true"
                  >
                    <div className="top-artist-avatar" />
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
                    <div className="top-artist-avatar">
                      <span className="top-artist-rank">{artist.rank}</span>
                      <img
                        src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                        alt={artist.name}
                        className="top-artist-img"
                      />
                    </div>
                    <p className="top-artist-name">{artist.name}</p>
                    <p className="top-artist-score">{artist.score}</p>
                  </div>
                ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default TopArtist;
