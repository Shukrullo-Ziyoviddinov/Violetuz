import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { useWeeklyTopMusic } from '../../hooks/useWeeklyTopMusic';
import { topRankSrc } from '../../utils/topRankPreview';
import './WeeklyTopMusic.css';

const formatDuration = (sec) => {
  if (!sec || Number.isNaN(sec) || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Haftaning top musiqalari — horizontal kartochka UI.
 * Rank | cover | title/artist/duration | play. Views/wishlist yo‘q.
 */
const WeeklyTopMusic = () => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { items, loading } = useWeeklyTopMusic();
  const { allMusic, musicLoading, getArtistById } = useMusicApi();
  const {
    currentMusic,
    isPlaying,
    duration: playerDuration,
    loadAndPlayTrack,
    togglePlay,
    getTitle: getPlayerTitle,
  } = useMusicPlayer();

  const displayItems = useMemo(() => {
    const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
    const out = [];
    for (const row of items) {
      const track = byId.get(String(row.contentId));
      if (!track) continue;
      out.push({
        ...track,
        rank: Number(row.rank) || out.length + 1,
      });
    }
    return out;
  }, [allMusic, items]);

  const waiting =
    loading || (items.length > 0 && musicLoading && displayItems.length === 0);

  const getTitle = (item) => {
    if (typeof getPlayerTitle === 'function') {
      const fromPlayer = getPlayerTitle(item);
      if (fromPlayer) return fromPlayer;
    }
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistName = (item) => {
    const artist = getArtistById?.(item.artistId);
    return artist?.name || item.artist || '';
  };

  const getItemDurationLabel = (item) => {
    const catalogSec = Number(item.durationSec ?? item.duration);
    if (Number.isFinite(catalogSec) && catalogSec > 0) {
      return formatDuration(catalogSec);
    }
    if (currentMusic && String(currentMusic.id) === String(item.id) && playerDuration > 0) {
      return formatDuration(playerDuration);
    }
    return '';
  };

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    if (currentMusic && String(currentMusic.id) === String(item.id)) {
      togglePlay();
      return;
    }
    loadAndPlayTrack(item.id, { autoplay: true, playlist: displayItems });
  };

  const handleCardClick = (item) => {
    if (currentMusic && String(currentMusic.id) === String(item.id)) {
      togglePlay();
      return;
    }
    loadAndPlayTrack(item.id, { autoplay: true, playlist: displayItems });
  };

  if (!waiting && displayItems.length === 0) return null;

  return (
    <div className="weekly-top-music" aria-busy={waiting || undefined}>
      <div className="weekly-top-music-container">
        <div className="weekly-top-music-header">
          <h2 className="weekly-top-music-title">
            {t('music.haftaningTopMusiqalari', 'Haftaning top 10 musiqalari')}
          </h2>
        </div>
        <div className="weekly-top-music-content">
          <HorizontalScroll scrollAmount={300}>
            {waiting
              ? Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={`weekly-top-music-skel-${i}`}
                    className="weekly-top-music-card weekly-top-music-card--skeleton"
                    aria-hidden="true"
                  >
                    <span className="weekly-top-music-rank weekly-top-music-rank--skeleton" />
                    <span className="weekly-top-music-cover weekly-top-music-cover--skeleton" />
                    <div className="weekly-top-music-info">
                      <SkeletonLoader variant="music-cards-item-title" />
                      <SkeletonLoader variant="music-cards-item-artist" />
                    </div>
                    <span className="weekly-top-music-play weekly-top-music-play--skeleton" />
                  </div>
                ))
              : displayItems.map((item) => {
                  const active =
                    currentMusic && String(currentMusic.id) === String(item.id);
                  const playing = active && isPlaying;
                  const durationLabel = getItemDurationLabel(item);

                  return (
                    <div
                      key={item.id}
                      className={`weekly-top-music-card${
                        active ? ' weekly-top-music-card--active' : ''
                      }`}
                      onClick={() => handleCardClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCardClick(item);
                        }
                      }}
                      aria-label={`${item.rank}. ${getTitle(item)}`}
                    >
                      <img
                        className="weekly-top-music-rank"
                        src={encodeURI(topRankSrc(item.rank))}
                        alt=""
                        aria-hidden="true"
                      />
                      <div className="weekly-top-music-cover">
                        <img
                          src={item.img || '/img/movie1.jpg'}
                          alt=""
                          className="weekly-top-music-cover-img"
                        />
                      </div>
                      <div className="weekly-top-music-info">
                        <span className="weekly-top-music-name">{getTitle(item)}</span>
                        <span className="weekly-top-music-artist">
                          {getArtistName(item)}
                        </span>
                        {durationLabel ? (
                          <span className="music-detail-artist-duration weekly-top-music-duration">
                            {durationLabel}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="weekly-top-music-play"
                        onClick={(e) => handlePlayClick(e, item)}
                        aria-label={playing ? t('player.pause', 'Pauza') : t('player.play', 'Ijro')}
                      >
                        {playing ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <polygon points="5 3 19 12 5 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTopMusic;
