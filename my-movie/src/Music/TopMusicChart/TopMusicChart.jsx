import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import ViewCount from '../../components/ViewCount/ViewCount';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import AudioDuration from '../AudioDuration/AudioDuration';
import TopMusicMoreModal from './TopMusicMoreModal';
import './TopMusicChart.css';

const formatDuration = (sec) => {
  if (!sec || Number.isNaN(sec) || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const DURATION_CLASS = 'music-detail-artist-duration top-music-chart-duration';

const TopMusicChartDuration = ({ item, isCurrent, playerDuration }) => {
  const catalogSec = Number(item.durationSec ?? item.duration);
  if (Number.isFinite(catalogSec) && catalogSec > 0) {
    return <span className={DURATION_CLASS}>{formatDuration(catalogSec)}</span>;
  }
  if (isCurrent && playerDuration > 0) {
    return <span className={DURATION_CLASS}>{formatDuration(playerDuration)}</span>;
  }
  if (!item.audio) return null;
  return <AudioDuration audioUrl={item.audio} className={DURATION_CLASS} />;
};

/**
 * Hafta / oy top musiqalari uchun umumiy horizontal chart UI.
 * Data + title + rankSrc mahsulot wrapperdan keladi.
 */
const TopMusicChart = ({
  items = [],
  loading = false,
  title,
  rankSrc,
  skeletonKey = 'top-music-chart',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allMusic, musicLoading, getArtistById } = useMusicApi();
  const {
    currentMusic,
    isPlaying,
    duration: playerDuration,
    dominantColor,
    loadAndPlayTrack,
    togglePlay,
    getTitle: getPlayerTitle,
  } = useMusicPlayer();

  const [moreOpen, setMoreOpen] = useState(false);
  const [moreAnchorRect, setMoreAnchorRect] = useState(null);
  const [moreMusic, setMoreMusic] = useState(null);

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

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    if (currentMusic && String(currentMusic.id) === String(item.id)) {
      togglePlay();
      return;
    }
    loadAndPlayTrack(item.id, { autoplay: true, playlist: displayItems });
  };

  const handleCardClick = (item) => {
    if (item?.id == null) return;
    navigate(`/music/${item.id}`);
  };

  const handleMoreClick = (e, item) => {
    e.stopPropagation();
    const rect = e.currentTarget?.getBoundingClientRect?.() || null;
    setMoreMusic({ id: item.id, title: getTitle(item) });
    setMoreAnchorRect(rect);
    setMoreOpen(true);
  };

  const handleMoreClose = () => {
    setMoreOpen(false);
    setMoreMusic(null);
    setMoreAnchorRect(null);
  };

  const activeCardStyle =
    dominantColor && typeof dominantColor.r === 'number'
      ? {
          background: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.25)`,
          border: `1px solid rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.5)`,
        }
      : undefined;

  if (!waiting && displayItems.length === 0) return null;

  const resolveRankSrc =
    typeof rankSrc === 'function' ? rankSrc : () => '';

  return (
    <div className="top-music-chart" aria-busy={waiting || undefined}>
      <div className="top-music-chart-container">
        <div className="top-music-chart-header">
          <h2 className="top-music-chart-title">{title}</h2>
        </div>
        <div className="top-music-chart-content">
          <HorizontalScroll scrollAmount={300}>
            {waiting
              ? Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={`${skeletonKey}-skel-${i}`}
                    className="top-music-chart-card top-music-chart-card--skeleton"
                    aria-hidden="true"
                  >
                    <span className="top-music-chart-rank top-music-chart-rank--skeleton" />
                    <span className="top-music-chart-cover top-music-chart-cover--skeleton" />
                    <div className="top-music-chart-info">
                      <SkeletonLoader variant="music-cards-item-title" />
                      <SkeletonLoader variant="music-cards-item-artist" />
                    </div>
                    <span className="top-music-chart-play top-music-chart-play--skeleton" />
                  </div>
                ))
              : displayItems.map((item) => {
                  const active =
                    currentMusic && String(currentMusic.id) === String(item.id);
                  const playing = active && isPlaying;
                  const rankImage = resolveRankSrc(item.rank);

                  return (
                    <div
                      key={item.id}
                      className={`top-music-chart-card${
                        active ? ' top-music-chart-card--active' : ''
                      }`}
                      style={active ? activeCardStyle : undefined}
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
                      {rankImage ? (
                        <img
                          className="top-music-chart-rank"
                          src={encodeURI(rankImage)}
                          alt=""
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="top-music-chart-rank" aria-hidden="true" />
                      )}
                      <div className="top-music-chart-cover">
                        <img
                          src={item.img || '/img/movie1.jpg'}
                          alt=""
                          className="top-music-chart-cover-img"
                        />
                      </div>
                      <div className="top-music-chart-info">
                        <span className="top-music-chart-name">{getTitle(item)}</span>
                        <span className="top-music-chart-artist">
                          {getArtistName(item)}
                        </span>
                        <div className="top-music-chart-meta-row">
                          <ViewCount
                            itemId={item.id}
                            type="music"
                            variant="icon"
                            iconKind="headphones"
                            record={false}
                            className="top-music-chart-views"
                          />
                          <TopMusicChartDuration
                            item={item}
                            isCurrent={!!active}
                            playerDuration={playerDuration}
                          />
                        </div>
                      </div>
                      <div className="top-music-chart-actions">
                        <button
                          type="button"
                          className="top-music-chart-play"
                          onClick={(e) => handlePlayClick(e, item)}
                          aria-label={
                            playing
                              ? t('player.pause', 'Pauza')
                              : t('player.play', 'Ijro')
                          }
                        >
                          {playing ? (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                          ) : (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <polygon points="5 3 19 12 5 21" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          className="top-music-chart-more"
                          onClick={(e) => handleMoreClick(e, item)}
                          aria-label={t('music.moreActions', 'Boshqa amallar')}
                          aria-haspopup="menu"
                          aria-expanded={
                            moreOpen &&
                            moreMusic &&
                            String(moreMusic.id) === String(item.id)
                          }
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="5" r="1.6" />
                            <circle cx="12" cy="12" r="1.6" />
                            <circle cx="12" cy="19" r="1.6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
          </HorizontalScroll>
        </div>
      </div>

      <TopMusicMoreModal
        open={moreOpen}
        onClose={handleMoreClose}
        anchorRect={moreAnchorRect}
        musicId={moreMusic?.id}
        title={moreMusic?.title || ''}
      />
    </div>
  );
};

export default TopMusicChart;
