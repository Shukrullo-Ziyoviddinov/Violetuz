import React, { useEffect, useState } from 'react';
import './VideoLoader.css';

const readVideo = (video, videoRef) => {
  if (video) return video;
  if (videoRef && typeof videoRef === 'object') return videoRef.current || null;
  return null;
};

const hasAddress = (el) => Boolean(el && (el.currentSrc || el.getAttribute('src')));

const isWaitingOnServer = (el) => {
  if (!hasAddress(el) || el.error) return false;
  if (el.seeking) return true;
  if (el.networkState === HTMLMediaElement.NETWORK_LOADING && el.readyState < 3) return true;
  if (el.readyState < 2 && el.networkState === HTMLMediaElement.NETWORK_LOADING) return true;
  return false;
};

/**
 * Video serverdan kadr kutayotganda chiqadigan yarim aylana.
 * Ma'lumot kelsa yashirinadi, oqim to'xtasa yana chiqadi.
 */
const VideoLoader = ({ video = null, videoRef = null, size = 'md' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = readVideo(video, videoRef);
    if (!el) {
      setVisible(false);
      return undefined;
    }

    const sync = () => setVisible(isWaitingOnServer(el));
    const show = () => {
      if (!hasAddress(el) || el.error) {
        setVisible(false);
        return;
      }
      setVisible(true);
    };
    const hideIfReady = () => {
      if (el.seeking) return;
      if (el.readyState >= 2) setVisible(false);
    };
    const onEmptied = () => setVisible(false);
    const onError = () => setVisible(false);

    el.addEventListener('waiting', show);
    el.addEventListener('stalled', show);
    el.addEventListener('seeking', show);
    el.addEventListener('loadstart', sync);
    el.addEventListener('progress', hideIfReady);
    el.addEventListener('loadeddata', hideIfReady);
    el.addEventListener('canplay', hideIfReady);
    el.addEventListener('canplaythrough', hideIfReady);
    el.addEventListener('playing', hideIfReady);
    el.addEventListener('seeked', hideIfReady);
    el.addEventListener('emptied', onEmptied);
    el.addEventListener('error', onError);
    sync();

    return () => {
      el.removeEventListener('waiting', show);
      el.removeEventListener('stalled', show);
      el.removeEventListener('seeking', show);
      el.removeEventListener('loadstart', sync);
      el.removeEventListener('progress', hideIfReady);
      el.removeEventListener('loadeddata', hideIfReady);
      el.removeEventListener('canplay', hideIfReady);
      el.removeEventListener('canplaythrough', hideIfReady);
      el.removeEventListener('playing', hideIfReady);
      el.removeEventListener('seeked', hideIfReady);
      el.removeEventListener('emptied', onEmptied);
      el.removeEventListener('error', onError);
    };
  }, [video, videoRef]);

  if (!visible) return null;

  return (
    <div
      className={`video-loader video-loader--${size}`}
      role="status"
      aria-live="polite"
      aria-label="Video yuklanmoqda"
    >
      <span className="video-loader-arc" />
    </div>
  );
};

export default VideoLoader;
