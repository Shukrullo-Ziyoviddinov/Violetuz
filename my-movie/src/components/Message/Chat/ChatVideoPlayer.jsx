import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from '../../UserAvatar/UserAvatar';
import { useModalHardwareBack } from '../../../useModalHardwareBack';
import { emojiFromId } from './chatEmojis';
import './ChatVideoPlayer.css';

const QUICK = ['1f44d', '2764', '1f602'];

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const ChatVideoPlayer = ({
  url,
  start = 0,
  duration = 0,
  viewOnce = false,
  mine = false,
  senderName = '',
  senderAvatar = '',
  lang = 'uz',
  burst = null,
  onSendReply,
  onMarkReply,
  onReact,
  onMoreEmoji,
  onRecord,
  coverOpen = false,
  onCoverBack,
  onClose,
  onWatched,
}) => {
  const videoRef = useRef(null);
  const backdropRef = useRef(null);
  const watchedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onWatchedRef = useRef(onWatched);
  const onCoverBackRef = useRef(onCoverBack);
  const [needTap, setNeedTap] = useState(false);
  const [controlsOn, setControlsOn] = useState(false);
  const [mark, setMark] = useState('play');
  const controlTimer = useRef(0);
  const [progress, setProgress] = useState(0);
  const openedBurst = useRef(burst?.token || 0);
  const [draft, setDraft] = useState('');
  const [floatEmoji, setFloatEmoji] = useState(null);
  onCloseRef.current = onClose;
  onWatchedRef.current = onWatched;
  onCoverBackRef.current = onCoverBack;
  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'violetChatVideoPlay',
    isOpen: true,
    hasNested: coverOpen,
    onNestedBack: () => onCoverBackRef.current?.(),
    onCloseFromHardware: () => onCloseRef.current?.(),
  });
  const releaseRef = useRef(releaseHistory);
  releaseRef.current = releaseHistory;
  const startAt = Math.max(0, Number(start) || 0);
  const endAt = startAt + Math.max(0.1, Number(duration) || 0);
  const ru = lang === 'ru';
  const who = mine
    ? (ru ? 'Вы' : 'Siz')
    : (ru ? `от ${senderName || '…'}` : `${senderName || '…'} dan`);
  const quick = QUICK.map((id) => emojiFromId(id)).filter(Boolean);

  useEffect(() => {
    if (!burst?.token || !burst.char || burst.token === openedBurst.current) {
      setFloatEmoji(null);
      return undefined;
    }
    const token = burst.token;
    setFloatEmoji({ char: burst.char, token, phase: 'in' });
    const holdTimer = window.setTimeout(() => {
      setFloatEmoji((current) => (current?.token === token ? { ...current, phase: 'out' } : current));
    }, 860);
    const endTimer = window.setTimeout(() => {
      setFloatEmoji((current) => (current?.token === token ? null : current));
    }, 1180);
    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(endTimer);
    };
  }, [burst]);

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
    const backdrop = backdropRef.current;
    const place = () => {
      const range = rangeRef.current;
      if (node && node.currentTime < range.startAt) node.currentTime = range.startAt;
      if (backdrop && backdrop.currentTime < range.startAt) backdrop.currentTime = range.startAt;
    };
    const syncBackdrop = () => {
      if (!node || !backdrop) return;
      if (Math.abs((backdrop.currentTime || 0) - (node.currentTime || 0)) > 0.35) {
        try { backdrop.currentTime = node.currentTime; } catch { /* Kadr hali tayyor emas. */ }
      }
      if (node.paused) backdrop.pause();
      else backdrop.play?.().catch(() => {});
    };
    const watch = () => {
      const range = rangeRef.current;
      if (!node || watchedRef.current) return;
      if (node.currentTime < range.startAt - 0.08) node.currentTime = range.startAt;
      const span = Math.max(0.1, range.endAt - range.startAt);
      const ratio = Math.min(1, Math.max(0, (node.currentTime - range.startAt) / span));
      setProgress(ratio);
      if (node.currentTime < range.endAt - 0.05) return;
      if (range.viewOnce && !range.mine) {
        node.pause();
        if (watchedRef.current) return;
        watchedRef.current = true;
        releaseRef.current();
        onCloseRef.current?.();
        onWatchedRef.current?.();
        return;
      }
      setProgress(0);
      node.currentTime = range.startAt;
      node.play?.().catch(() => setNeedTap(true));
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      releaseRef.current();
      onCloseRef.current?.();
    };
    node?.addEventListener('loadedmetadata', place);
    backdrop?.addEventListener('loadedmetadata', place);
    node?.addEventListener('timeupdate', watch);
    node?.addEventListener('timeupdate', syncBackdrop);
    node?.addEventListener('play', syncBackdrop);
    node?.addEventListener('pause', syncBackdrop);
    node?.addEventListener('seeked', syncBackdrop);
    window.addEventListener('keydown', onKey);
    node?.play?.().then(() => setNeedTap(false)).catch(() => setNeedTap(true));
    return () => {
      node?.removeEventListener('loadedmetadata', place);
      backdrop?.removeEventListener('loadedmetadata', place);
      node?.removeEventListener('timeupdate', watch);
      node?.removeEventListener('timeupdate', syncBackdrop);
      node?.removeEventListener('play', syncBackdrop);
      node?.removeEventListener('pause', syncBackdrop);
      node?.removeEventListener('seeked', syncBackdrop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const begin = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.currentTime < startAt || node.currentTime >= endAt - 0.05) node.currentTime = startAt;
    node.play().then(() => setNeedTap(false)).catch(() => setNeedTap(true));
  };

  const togglePlayback = (event) => {
    event?.stopPropagation?.();
    const node = videoRef.current;
    if (!node) return;
    const willPlay = node.paused || needTap;
    if (willPlay) begin();
    else node.pause();
    setMark(willPlay ? 'play' : 'pause');
    setControlsOn(true);
    window.clearTimeout(controlTimer.current);
    controlTimer.current = window.setTimeout(() => setControlsOn(false), 680);
  };
  const onPlayerClick = (event) => {
    if (event.target.closest('.chat-video-player-reply, .chat-video-player-top')) return;
    togglePlayback(event);
  };
  useEffect(() => () => window.clearTimeout(controlTimer.current), []);

  const sendReply = (event) => {
    event?.preventDefault?.();
    const text = draft.trim();
    if (!text) return;
    onSendReply?.(text);
    setDraft('');
  };

  return (
    <div className="chat-video-player" role="dialog" aria-modal="true" aria-label="Video" onClick={onPlayerClick}>
      <video
        ref={backdropRef}
        className="chat-video-player-backdrop"
        src={url}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="chat-video-player-top">
        <div className="chat-video-player-progress" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <header className="chat-video-player-bar">
        <button type="button" className="chat-video-player-back" aria-label={ru ? 'Назад' : 'Orqaga'} onClick={close}>
          ‹
        </button>
        <span className="chat-video-player-who">
          <span className="chat-video-player-avatar" aria-hidden="true">
            <UserAvatar
              src={senderAvatar}
              className="chat-video-player-avatar-img"
              fallback={<span>{initialsOf(senderName)}</span>}
            />
          </span>
          <span>{who}</span>
        </span>
        </header>
      </div>
      <video
        ref={videoRef}
        className="chat-video-player-film"
        src={url}
        autoPlay
        playsInline
        onEnded={() => {
          if (viewOnce && !mine) finish();
        }}
      />
      {controlsOn ? (
        <button
          type="button"
          className="chat-video-player-play"
          aria-label={mark === 'play' ? (ru ? 'Смотреть' : 'Ko‘rish') : (ru ? 'Пауза' : 'Pauza')}
        >
          {mark === 'play' ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 7.5v9l8-4.5-8-4.5Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 6h3v12H8zM13 6h3v12h-3z" />
            </svg>
          )}
        </button>
      ) : null}
      {floatEmoji ? (
        <span className={`chat-video-player-float is-${floatEmoji.phase}`} aria-hidden="true">{floatEmoji.char}</span>
      ) : null}
      <form className="chat-video-player-reply" onSubmit={sendReply} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="chat-video-player-cam" aria-label={ru ? 'Видео' : 'Video'} onClick={() => onRecord?.()}>
          <i className="fa-solid fa-video" aria-hidden="true" />
        </button>
        <label className={`chat-video-player-field${draft.trim() ? ' has-text' : ''}`}>
          <input
            value={draft}
            placeholder={ru ? 'Ответить' : 'Javob berish'}
            enterKeyHint="send"
            onChange={(event) => {
              setDraft(event.target.value);
              onMarkReply?.();
            }}
            onFocus={() => onMarkReply?.()}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return;
              event.preventDefault();
              sendReply(event);
            }}
          />
          <span className="chat-video-player-field-end">
            <span className="chat-video-player-emojis">
              {quick.map((item) => (
                <button key={item.id} type="button" onClick={() => onReact?.(item)} aria-label={item.char}>
                  {item.char}
                </button>
              ))}
              <button type="button" className="is-more" onClick={() => onMoreEmoji?.()} aria-label={ru ? 'Ещё' : 'Yana'}>+</button>
            </span>
            <button type="submit" className="chat-video-player-send" aria-label={ru ? 'Отправить' : 'Yuborish'} tabIndex={draft.trim() ? 0 : -1}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.2 11.1 20.6 3.4c.8-.4 1.6.4 1.2 1.2l-8.2 17.2c-.4.8-1.6.7-1.8-.2l-2-6.6-6.6-2c-.9-.2-1-1.4-.2-1.9Z" />
              </svg>
            </button>
          </span>
        </label>
      </form>
    </div>
  );
};

export default ChatVideoPlayer;
