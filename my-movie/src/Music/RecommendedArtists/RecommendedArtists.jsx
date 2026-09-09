import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useMusicApi } from '../../context/MusicApiContext';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import { useRecommendedArtistsRanking } from '../../hooks/useRecommendedArtistsRanking';
import { useAppSelector } from '../../store/hooks';
import { selectIsLoggedIn, selectAuthReady } from '../../store/slices/userSlice';
import './RecommendedArtists.css';

const uniqueArtistsById = (list) => {
  const seen = new Set();
  return (list || []).filter((a) => {
    const id = String(a?.id ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

/**
 * Personalized order when ranked scores exist (≥2 contents); else catalog.
 * @param {Array} catalogArtists
 * @param {Array<{ artistId: string, score: number }>|null} ranked
 */
const orderArtistsByRanking = (catalogArtists, ranked) => {
  const unique = uniqueArtistsById(catalogArtists);
  if (!ranked?.length) return unique;

  const byId = new Map(unique.map((a) => [String(a.id), a]));
  const ordered = [];
  const seen = new Set();

  for (const row of ranked) {
    const id = String(row.artistId ?? '');
    const artist = byId.get(id);
    if (!artist || seen.has(id)) continue;
    seen.add(id);
    ordered.push(artist);
  }

  return ordered.length ? ordered : unique;
};

const RecommendedArtists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allArtists } = useMusicApi();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { ranked, loading: rankingLoading } = useRecommendedArtistsRanking();

  const displayArtists = useMemo(
    () => orderArtistsByRanking(allArtists, ranked),
    [allArtists, ranked]
  );
  const waitingPersonalized =
    authReady && isLoggedIn && rankingLoading && ranked === null;

  const handleArtistClick = (artistId) => {
    navigate(`/music/artist/${artistId}`);
  };

  return (
    <div className="recommended-artists" aria-busy={waitingPersonalized || undefined}>
      <div className="recommended-artists-container">
        <div className="recommended-artists-header">
          <h2 className="recommended-artists-title">
            {t('music.tavsiyaEtilganArtistlar', 'Tavsiya etilgan artistlar')}
          </h2>
        </div>
        <div className="recommended-artists-content">
          <HorizontalScroll scrollAmount={140}>
            {waitingPersonalized
              ? null
              : displayArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="recommended-artists-item"
                    onClick={() => handleArtistClick(artist.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleArtistClick(artist.id);
                      }
                    }}
                    aria-label={`${artist.name} - ${t('music.title', 'Musiqa')}`}
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

export default RecommendedArtists;
