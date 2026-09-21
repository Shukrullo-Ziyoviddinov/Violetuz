import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import FollowingButton from '../FollowingButton/FollowingButton';
import { useMusicApi } from '../../context/MusicApiContext';
import { usePopularArtists } from '../../hooks/usePopularArtists';
import '../RecommendedArtists/RecommendedArtists.css';

/**
 * Mashhur artistlar — thin product wrapper (30 kun, limit 20).
 * Kartochka UI: Tavsiya etilgan artistlar bilan bir xil (+ Following).
 * Data: usePopularArtists — TopArtistsCarousel / rank PNG emas.
 */
const PopularArtists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allArtists } = useMusicApi();
  const { items, loading } = usePopularArtists(20);

  const displayArtists = useMemo(() => {
    const byId = new Map((allArtists || []).map((a) => [String(a.id), a]));
    const out = [];
    for (const row of items) {
      const artist = byId.get(String(row.artistId));
      if (!artist) continue;
      out.push(artist);
    }
    return out;
  }, [allArtists, items]);

  if (!loading && displayArtists.length === 0) return null;

  return (
    <div className="recommended-artists" aria-busy={loading || undefined}>
      <div className="recommended-artists-container">
        <div className="recommended-artists-header">
          <h2 className="recommended-artists-title">
            {t('music.mashhurArtistlar', 'Mashhur artistlar')}
          </h2>
        </div>
        <div className="recommended-artists-content">
          <HorizontalScroll scrollAmount={140}>
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={`popular-artist-skel-${i}`}
                    className="recommended-artists-item"
                    aria-hidden="true"
                  >
                    <div className="recommended-artists-img-wrap" />
                  </div>
                ))
              : displayArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="recommended-artists-item"
                    onClick={() => navigate(`/music/artist/${artist.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/music/artist/${artist.id}`);
                      }
                    }}
                    aria-label={artist.name}
                  >
                    <div className="recommended-artists-img-wrap">
                      <img
                        src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                        alt={artist.name}
                        className="recommended-artists-img"
                      />
                    </div>
                    <p className="recommended-artists-name">{artist.name}</p>
                    <FollowingButton
                      artistId={artist.id}
                      entityType="artist"
                      wrapperClassName="recommended-artists-follow"
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

export default PopularArtists;
