import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import { useMusicApi } from '../../context/MusicApiContext';
import FollowingButton from '../../Music/FollowingButton/FollowingButton';
import { useRecommendedArtistsRanking } from '../../hooks/useRecommendedArtistsRanking';
import { useTrendingArtistsRanking } from '../../hooks/useTrendingArtistsRanking';
import { useAppSelector } from '../../store/hooks';
import { selectAuthReady } from '../../store/slices/userSlice';
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
 * Merge personal + trending into one ordered list:
 * personal first (ranked), then trending (no duplicates).
 */
const mergeArtistsByPersonalAndTrending = (catalogArtists, ranked, trending) => {
  const unique = uniqueArtistsById(catalogArtists);
  const byId = new Map(unique.map((a) => [String(a.id), a]));

  const ordered = [];
  const seen = new Set();

  const pushId = (artistId) => {
    const id = String(artistId ?? '');
    if (!id || seen.has(id)) return;
    const artist = byId.get(id);
    if (!artist) return;
    seen.add(id);
    ordered.push(artist);
  };

  const rankedList = Array.isArray(ranked) ? ranked : [];
  const trendingList = Array.isArray(trending) ? trending : [];

  for (const row of rankedList) pushId(row?.artistId);
  for (const row of trendingList) pushId(row?.artistId);

  return ordered.length ? ordered : unique;
};

const RecommendedArtists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allArtists } = useMusicApi();
  const authReady = useAppSelector(selectAuthReady);
  const { ranked, loading: rankingLoading } = useRecommendedArtistsRanking();
  const { trending, loading: trendingLoading } = useTrendingArtistsRanking();

  const displayArtists = useMemo(
    () => mergeArtistsByPersonalAndTrending(allArtists, ranked, trending),
    [allArtists, ranked, trending]
  );
  // Login + guest: shaxsiy ranking kelguncha skeleton (trending flash yo‘q)
  // Merge tartibi o‘zgarmaydi: shaxsiy → trending
  const waitingPersonalized = !authReady || rankingLoading;
  const waitingAny = waitingPersonalized || trendingLoading;

  const handleArtistClick = (artistId) => {
    navigate(`/music/artist/${artistId}`);
  };

  return (
    <div className="recommended-artists" aria-busy={waitingAny || undefined}>
      <div className="recommended-artists-container">
        <div className="recommended-artists-header">
          <h2 className="recommended-artists-title">
            {t('music.tavsiyaEtilganArtistlar', 'Tavsiya etilgan artistlar')}
          </h2>
        </div>
        <div className="recommended-artists-content">
          <HorizontalScroll scrollAmount={140}>
            {waitingAny
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
