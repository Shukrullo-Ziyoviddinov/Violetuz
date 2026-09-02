import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ShareButton from '../ShareButton/ShareButton';
import TaronaPlayingBars from './TaronaPlayingBars';
import VoiceSearchTaronaModal from './VoiceSearchTaronaModal';
import useTaronaInlinePlayer from './useTaronaInlinePlayer';

const TaronaShareLauncher = ({ item, launchKey }) => {
  const { t } = useTranslation();
  const hostRef = useRef(null);

  useEffect(() => {
    if (!item || !launchKey) return undefined;

    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        hostRef.current?.querySelector('button.share-button')?.click();
      });
    });

    return () => window.cancelAnimationFrame(id);
  }, [item, launchKey]);

  if (!item) return null;

  return (
    <div ref={hostRef} className="voice-search-tarona-share-host" aria-hidden="true">
      <ShareButton
        movie={{ title: item.title }}
        sharePath={`/music/${item.id}`}
        dropdownInPortal
        icon="send"
        label={t('voiceSearch.taronaShare', 'Yuborish')}
        className="voice-search-tarona-share"
        buttonClassName="voice-search-tarona-share-trigger"
      />
    </div>
  );
};

const formatTrackDuration = (sec) => {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return '';
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const TaronaResults = ({ matches, onGoToMusic }) => {
  const { t } = useTranslation();
  const [menuItem, setMenuItem] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [shareLaunchKey, setShareLaunchKey] = useState(0);
  const { audioRef, analyserRef, playingId, isPlaying, toggleTrack, stop, handlePlay, handlePause, handleEnded } =
    useTaronaInlinePlayer();

  useEffect(() => {
    stop();
    setMenuOpen(false);
    setMenuItem(null);
  }, [matches, stop]);

  const openMenu = (item, e) => {
    e.stopPropagation();
    setMenuItem(item);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuItem(null);
  };

  const handleShareFromMenu = (item) => {
    setShareItem(item);
    setShareLaunchKey((key) => key + 1);
  };

  if (!matches?.length) {
    return (
      <div className="tarona-results tarona-results--empty">
        <p>{t('voiceSearch.taronaNoResults', 'Mos musiqa topilmadi')}</p>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        playsInline
        className="tarona-results-audio"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />
      <ul className="tarona-results" aria-label={t('voiceSearch.taronaResults', 'Natijalar')}>
        {matches.map((item) => {
          const durationLabel = formatTrackDuration(item.durationSec);
          const active = playingId === item.id;

          return (
            <li key={item.id}>
              <div
                className={`tarona-results-item${active ? ' tarona-results-item--active' : ''}`}
              >
                <button
                  type="button"
                  className="tarona-results-item-main"
                  onClick={() => toggleTrack(item)}
                  aria-pressed={active && isPlaying}
                >
                  <span className="tarona-results-thumb-wrap">
                    <img
                      src={item.img || '/img/movie1.jpg'}
                      alt=""
                      className="tarona-results-thumb"
                      loading="lazy"
                    />
                  </span>
                  <span className="tarona-results-text">
                    <span className="tarona-results-title" title={item.title}>
                      {item.title}
                    </span>
                    <span className="tarona-results-artist" title={item.artistName || item.artistId}>
                      {item.artistName || item.artistId}
                    </span>
                    {durationLabel ? (
                      <span className="tarona-results-duration">{durationLabel}</span>
                    ) : null}
                  </span>
                  {active ? (
                    <TaronaPlayingBars analyserRef={analyserRef} isPlaying={isPlaying} />
                  ) : null}
                </button>
                <button
                  type="button"
                  className="tarona-results-more"
                  onClick={(e) => openMenu(item, e)}
                  aria-label={t('voiceSearch.taronaMore', 'Boshqa amallar')}
                >
                  <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <VoiceSearchTaronaModal
        open={menuOpen}
        onClose={closeMenu}
        item={menuItem}
        onGoToMusic={onGoToMusic}
        onShare={handleShareFromMenu}
      />

      <TaronaShareLauncher item={shareItem} launchKey={shareLaunchKey} />
    </>
  );
};

export default TaronaResults;
