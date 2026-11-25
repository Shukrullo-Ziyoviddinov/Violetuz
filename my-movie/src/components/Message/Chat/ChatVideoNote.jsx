import React, { useEffect, useRef } from 'react';
import './ChatVideoNote.css';

const clockOf = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const Holes = () => (
  <span className="chat-video-note-holes" aria-hidden="true">
    {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
  </span>
);

const ChatVideoNote = ({ url, poster = '', preview = '', duration = 0, start = 0, uploading = false, failed = false, progress = 0, fetching = false, downloadProgress = null, onCancel, onDownload, onOpen }) => {
  const videoRef = useRef(null);
  const source = url || preview;
  const frameSource = !source || source.startsWith('blob:') || source.includes('#')
    ? source
    : `${source}#t=${Math.max(0.25, Number(start) || 0).toFixed(1)}`;

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !source) return undefined;
    let gone = false;
    let armed = false;
    node.muted = true;
    node.defaultMuted = true;
    const stop = () => {
      if (!gone) node.pause();
    };
    const afterFrame = () => {
      if (gone || armed) return;
      armed = true;
      if (typeof node.requestVideoFrameCallback === 'function') node.requestVideoFrameCallback(() => stop());
      else window.setTimeout(stop, 240);
    };
    const kick = () => {
      if (gone) return;
      const pending = node.play();
      if (pending && typeof pending.then === 'function') pending.then(afterFrame).catch(() => {});
      else afterFrame();
    };
    node.addEventListener('loadeddata', kick);
    if (node.readyState >= 2) kick();
    return () => {
      gone = true;
      node.removeEventListener('loadeddata', kick);
    };
  }, [source]);

  return (
    <div className={`chat-video-note${uploading || failed ? ' is-uploading' : ''}${failed ? ' is-failed' : ''}`}>
      <Holes />
      <span className="chat-video-note-face">
        {source ? <video ref={videoRef} src={frameSource} poster={url ? undefined : poster || undefined} muted playsInline preload={url ? 'metadata' : 'auto'} /> : poster ? <img className="chat-video-note-still" src={poster} alt="" /> : null}
        {uploading || failed ? (
          <span className="chat-video-note-progress">
            <strong>{failed ? 'Xatolik' : `${Math.max(0, Math.min(100, Math.round(progress)))}%`}</strong>
            <button
              type="button"
              className="chat-video-note-cancel"
              aria-label="Bekor qilish"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onCancel?.();
              }}
            >
              ×
            </button>
          </span>
        ) : (
          <span className="chat-video-note-length">{clockOf(duration)}</span>
        )}
        {!uploading && !failed && fetching ? (
          <button
            type="button"
            className="chat-video-note-fetch"
            disabled={downloadProgress != null}
            aria-label={downloadProgress != null ? `${Math.round(downloadProgress)}%` : 'Yuklab olish'}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (downloadProgress == null) onDownload?.();
            }}
          >
            {downloadProgress != null ? <strong>{Math.round(downloadProgress)}%</strong> : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4v10" />
                <path d="m8 10 4 4 4-4" />
                <path d="M6 19h12" />
              </svg>
            )}
          </button>
        ) : null}
        {!uploading && !failed && !fetching && onOpen ? (
          <button
            type="button"
            className="chat-video-note-open"
            aria-label="Ko‘rish"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          />
        ) : null}
      </span>
      <Holes />
    </div>
  );
};

export default ChatVideoNote;
