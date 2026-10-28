import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { useMostListenedMusic } from '../../hooks/useMostListenedMusic';
import TopMusicMoreModal from '../TopMusicChart/TopMusicMoreModal';
import './SearchModalTrending.css';

const PREVIEW_LIMIT = 6;
const MORE_PATH = '/music/more/hozir-trendda';

const padRank = (n) => String(n).padStart(2, '0');

/**
 * Qidiruv modalidagi “Hozir trendda”.
 * Ma’lumot: oxirgi 7 kun, eng ko‘p tinglangan 20 ta. Bu yerda birinchi 6 tasi.
 */
const SearchModalTrending = ({ onNavigateAway }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allMusic, musicLoading, getArtistById } = useMusicApi();
  const { items, loading } = useMostListenedMusic();
  const {
    currentMusic,
    isPlaying,
    loadAndPlayTrack,
    togglePlay,
    getTitle: getPlayerTitle,
  } = useMusicPlayer();

  const [moreOpen, setMoreOpen] = useState(false);
  const [moreAnchorRect, setMoreAnchorRect] = useState(null);
  const [moreMusic, setMoreMusic] = useState(null);

  const ranked = useMemo(() => {
    const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
    const out = [];
    for (const row of items) {
      const track = byId.get(String(row.contentId));
      if (!track) continue;
      out.push(track);
    }
    return out;
  }, [allMusic, items]);

  const preview = ranked.slice(0, PREVIEW_LIMIT);
  const waiting =
    loading || (items.length > 0 && musicLoading && preview.length === 0);

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

  const goMore = () => {
    onNavigateAway?.();
    navigate(MORE_PATH);
  };

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    if (currentMusic && String(currentMusic.id) === String(item.id)) {
      togglePlay();
      return;
    }
    loadAndPlayTrack(item.id, { autoplay: true, playlist: ranked });
  };

  const handleRowClick = (item) => {
    if (item?.id == null) return;
    onNavigateAway?.();
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

  if (!waiting && preview.length === 0) return null;

  return (
    <section className="search-modal-trending" aria-busy={waiting || undefined}>
      <div className="search-modal-trending-header">
        <h2 className="search-modal-trending-title">
          <span className="search-modal-trending-flame" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.2 2s.4 3.2-1.6 5.4C8.8 9.4 8 11 8 13.2 8 16.4 10.2 19 13 19c2.2 0 3.6-1.4 3.6-3.4 0-2.2-1.2-3.4-1.2-5.2 0 0 2.8 1.6 2.8 5 0 3.6-2.8 6.6-6.4 6.6S5 19 5 15.2C5 10.6 8.4 7.2 12.2 2z" />
            </svg>
          </span>
          {t('music.hozirTrendda', 'Hozir trendda')}
        </h2>
        <button type="button" className="search-modal-trending-more" onClick={goMore}>
          {t('music.barchasiniKorish', "Barchasini ko'rish")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.3 6.3 14.9 12l-5.6 5.7 1.4 1.4L17.8 12 10.7 4.9z" />
          </svg>
        </button>
      </div>

      <div className="search-modal-trending-list">
        {waiting
          ? Array.from({ length: PREVIEW_LIMIT }, (_, i) => (
              <div
                key={`search-trend-skel-${i}`}
                className="search-modal-trending-row search-modal-trending-row--skeleton"
                aria-hidden="true"
              />
            ))
          : preview.map((item, index) => {
              const active = currentMusic && String(currentMusic.id) === String(item.id);
              const playing = active && isPlaying;
              const title = getTitle(item);
              return (
                <div
                  key={item.id}
                  className={`search-modal-trending-row${
                    active ? ' search-modal-trending-row--active' : ''
                  }`}
                  onClick={() => handleRowClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(item);
                    }
                  }}
                >
                  <span className="search-modal-trending-rank">{padRank(index + 1)}</span>
                  <span className="search-modal-trending-cover">
                    <img src={item.img || '/img/movie1.jpg'} alt="" />
                    <button
                      type="button"
                      className="search-modal-trending-play"
                      onClick={(e) => handlePlayClick(e, item)}
                      aria-label={
                        playing
                          ? t('player.pause', 'Pauza')
                          : t('player.play', 'Ijro')
                      }
                    >
                      {playing ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <polygon points="6 4 20 12 6 20" />
                        </svg>
                      )}
                    </button>
                  </span>
                  <span className="search-modal-trending-meta">
                    <span className="search-modal-trending-name">{title}</span>
                    <span className="search-modal-trending-artist">{getArtistName(item)}</span>
                  </span>
                  <button
                    type="button"
                    className="search-modal-trending-actions"
                    onClick={(e) => handleMoreClick(e, item)}
                    aria-label={t('music.moreActions', 'Boshqa amallar')}
                    aria-haspopup="menu"
                    aria-expanded={
                      moreOpen && moreMusic && String(moreMusic.id) === String(item.id)
                    }
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="5" r="1.7" />
                      <circle cx="12" cy="12" r="1.7" />
                      <circle cx="12" cy="19" r="1.7" />
                    </svg>
                  </button>
                </div>
              );
            })}
      </div>

      <TopMusicMoreModal
        open={moreOpen}
        onClose={handleMoreClose}
        anchorRect={moreAnchorRect}
        musicId={moreMusic?.id}
        title={moreMusic?.title || ''}
      />
    </section>
  );
};

export default SearchModalTrending;
