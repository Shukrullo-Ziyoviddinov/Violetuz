import React, { useEffect, useRef, useState } from 'react';
import { useModalHardwareBack } from '../../../useModalHardwareBack';
import './ChatVideoPlayer.css';

const ChatVideoPlayer = ({ url, start = 0, duration = 0, viewOnce = false, mine = false, onClose, onWatched }) => {
  const videoRef = useRef(null);
  const watchedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onWatchedRef = useRef(onWatched);
  const [needTap, setNeedTap] = useState(false);
  onCloseRef.current = onClose;
  onWatchedRef.current = onWatched;
  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'violetChatVideoPlay',
    isOpen: true,
    onCloseFromHardware: () => onCloseRef.current?.(),
  });
  const releaseRef = useRef(releaseHistory);
  releaseRef.current = releaseHistory;
  const startAt = Math.max(0, Number(start) || 0);
  const endAt = startAt + Math.max(0.1, Number(duration) || 0);

  const close = () => {
    releaseRef.current();
    onCloseRef.current?.();
  };

  const finish = () => {
    if (watchedRef.current) return;
    watchedRef.current = true;
    const watched = viewOnce && !mine;
    close();
    if (watched) onWatchedRef.current?.();
  };

  const rangeRef = useRef({ startAt, endAt, viewOnce, mine });
  rangeRef.current = { startAt, endAt, viewOnce, mine };

  useEffect(() => {
    const node = videoRef.current;
    const place = () => {
      const range = rangeRef.current;
      if (node && node.currentTime < range.startAt) node.currentTime = range.startAt;
    };
    const watch = () => {
      const range = rangeRef.current;
      if (!node || watchedRef.current) return;
      if (node.currentTime < range.startAt - 0.08) node.currentTime = range.startAt;
      if (node.currentTime < range.endAt - 0.05) return;
      node.pause();
      if (!(range.viewOnce && !range.mine)) {
        node.currentTime = range.startAt;
        return;
      }
      if (watchedRef.current) return;
      watchedRef.current = true;
      releaseRef.current();
      onCloseRef.current?.();
      onWatchedRef.current?.();
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      releaseRef.current();
      onCloseRef.current?.();
    };
    node?.addEventListener('loadedmetadata', place);
    node?.addEventListener('timeupdate', watch);
    window.addEventListener('keydown', onKey);
    node?.play?.().then(() => setNeedTap(false)).catch(() => setNeedTap(true));
    return () => {
      node?.removeEventListener('loadedmetadata', place);
      node?.removeEventListener('timeupdate', watch);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const begin = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.currentTime < startAt || node.currentTime >= endAt - 0.05) node.currentTime = startAt;
    node.play().then(() => setNeedTap(false)).catch(() => setNeedTap(true));
  };

  return (
    <div className="chat-video-player" role="dialog" aria-modal="true" aria-label="Video">
      <button type="button" className="chat-video-player-close" aria-label="Yopish" onClick={close}>
        ×
      </button>
      <video
        ref={videoRef}
        src={url}
        autoPlay
        playsInline
        controls={!viewOnce}
        onEnded={() => {
          if (viewOnce && !mine) finish();
        }}
      />
      {needTap ? (
        <button type="button" className="chat-video-player-play" onClick={begin} aria-label="Ko‘rish">
          ▶
        </button>
      ) : null}
    </div>
  );
};

export default ChatVideoPlayer;
