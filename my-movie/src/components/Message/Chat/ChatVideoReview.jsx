import React, { useEffect, useRef, useState } from 'react';

const MIN_SECONDS = 0.4;

const clockOf = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const ChatVideoReview = ({ lang, peerName, clip, onBack, onSend }) => {
  const videoRef = useRef(null);
  const barRef = useRef(null);
  const [length, setLength] = useState(clip?.seconds || 0);
  const [trim, setTrim] = useState({ start: 0, end: 1 });
  const [frames, setFrames] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const ru = lang === 'ru';
  const name = String(peerName || '').trim() || (ru ? 'собеседник' : 'suhbatdosh');
  const span = Math.max(MIN_SECONDS, (trim.end - trim.start) * length);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return undefined;
    const read = () => {
      const raw = node.duration;
      const next = Number.isFinite(raw) && raw > 0 && raw !== Infinity ? raw : (clip?.seconds || 0);
      if (next > 0) setLength(next);
    };
    node.addEventListener('loadedmetadata', read);
    return () => node.removeEventListener('loadedmetadata', read);
  }, [clip?.seconds, clip?.url]);

  useEffect(() => {
    if (!clip?.url || !(length > 0)) return undefined;
    let dead = false;
    const probe = document.createElement('video');
    probe.src = clip.url;
    probe.muted = true;
    probe.playsInline = true;
    probe.preload = 'auto';
    const seek = (time) => new Promise((resolve) => {
      const done = () => {
        probe.removeEventListener('seeked', done);
        resolve();
      };
      probe.addEventListener('seeked', done);
      probe.currentTime = time;
    });
    const sample = async () => {
      await new Promise((resolve) => {
        if (probe.readyState >= 1) resolve();
        else probe.addEventListener('loadedmetadata', resolve, { once: true });
      });
      if (dead) return;
      const shots = [];
      const count = 8;
      for (let index = 0; index < count; index += 1) {
        const at = Math.min(length - 0.05, (length * (index + 0.5)) / count);
        try {
          await seek(Math.max(0, at));
        } catch {
          break;
        }
        if (dead) return;
        const canvas = document.createElement('canvas');
        canvas.width = 36;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        if (probe.videoWidth) ctx.drawImage(probe, 0, 0, 36, 48);
        shots.push(canvas.toDataURL('image/jpeg', 0.55));
      }
      if (!dead && shots.length) setFrames(shots);
    };
    sample().catch(() => {});
    return () => {
      dead = true;
      probe.removeAttribute('src');
      probe.load();
    };
  }, [clip?.url, length]);

  const play = async () => {
    const node = videoRef.current;
    if (!node || !(length > 0)) return;
    if (!node.paused) {
      node.pause();
      setPlaying(false);
      return;
    }
    const start = trim.start * length;
    const end = Math.max(start + 0.05, trim.end * length);
    node.currentTime = start;
    try {
      await node.play();
    } catch {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const watch = () => {
      if (node.currentTime < end && !node.paused) return;
      node.pause();
      node.currentTime = start;
      setPlaying(false);
      node.removeEventListener('timeupdate', watch);
    };
    node.addEventListener('timeupdate', watch);
  };

  const drag = (edge, event) => {
    event.preventDefault();
    const move = (pointer) => {
      const bar = barRef.current;
      if (!bar || !(length > 0)) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (pointer.clientX - rect.left) / rect.width));
      const gap = Math.min(0.5, MIN_SECONDS / length);
      setTrim((current) => {
        if (edge === 'start') {
          return { start: Math.min(ratio, current.end - gap), end: current.end };
        }
        return { start: current.start, end: Math.max(ratio, current.start + gap) };
      });
    };
    move(event);
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const send = () => {
    const start = trim.start * length;
    const end = trim.end * length;
    onSend?.({
      blob: clip.blob,
      type: clip.type,
      viewOnce,
      start,
      end,
      duration: Math.max(MIN_SECONDS, end - start),
    });
  };

  return (
    <>
      <header className="chat-video-bar">
        <button type="button" className="chat-video-icon" onClick={onBack} aria-label={ru ? 'Назад' : 'Orqaga'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 5.5 8 12l6.5 6.5" />
          </svg>
        </button>
        <h2>{ru ? 'Просмотр' : 'Ko‘rib chiqish'}</h2>
        <span />
      </header>
      <div className="chat-video-stage is-review">
        <video ref={videoRef} className="chat-video-preview" src={clip.url} playsInline preload="auto" />
        <span className="chat-video-time">{clockOf(span)}</span>
        <button type="button" className={`chat-video-play${playing ? ' is-on' : ''}`} onClick={play} aria-label={ru ? 'Смотреть' : 'Ko‘rish'}>
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 6h3v12H8zM13 6h3v12h-3z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 7.5v9l8-4.5-8-4.5Z" />
            </svg>
          )}
        </button>
      </div>
      <p className="chat-video-hint">{ru ? 'Потяните края, чтобы обрезать' : 'Qirqish uchun chetlarini suring'}</p>
      <div className="chat-video-trim" ref={barRef}>
        <span className="chat-video-frames">
          {(frames.length ? frames : Array.from({ length: 8 }, (_, index) => index)).map((frame, index) => (
            typeof frame === 'string'
              ? <img key={frame.slice(-24) + index} src={frame} alt="" />
              : <i key={index} />
          ))}
        </span>
        <span className="chat-video-shade is-left" style={{ width: `${trim.start * 100}%` }} />
        <span className="chat-video-shade is-right" style={{ width: `${(1 - trim.end) * 100}%` }} />
        <button
          type="button"
          className="chat-video-handle is-start"
          style={{ left: `${trim.start * 100}%` }}
          aria-label={ru ? 'Начало' : 'Boshlanish'}
          onPointerDown={(event) => drag('start', event)}
        />
        <button
          type="button"
          className="chat-video-handle is-end"
          style={{ left: `${trim.end * 100}%` }}
          aria-label={ru ? 'Конец' : 'Tugash'}
          onPointerDown={(event) => drag('end', event)}
        />
      </div>
      <div className="chat-video-once">
        <span>
          <strong>{ru ? 'Просмотр один раз' : 'Bir marta ko‘rish'}</strong>
          <small>{ru ? `Исчезнет, когда ${name} посмотрит` : `${name} ko‘rgandan keyin yo‘qoladi`}</small>
        </span>
        <button
          type="button"
          className={`chat-video-switch${viewOnce ? ' is-on' : ''}`}
          aria-pressed={viewOnce}
          onClick={() => setViewOnce((current) => !current)}
        />
      </div>
      <div className="chat-video-actions">
        <button type="button" className="chat-video-again" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 8H5.2A6.8 6.8 0 0 1 17 6.2" />
            <path d="M16 4.2 17.4 7 14.6 7.6" />
            <path d="M16 16h2.8A6.8 6.8 0 0 1 7 17.8" />
            <path d="M8 19.8 6.6 17l2.8-.6" />
          </svg>
          {ru ? 'Переснять' : 'Qayta olish'}
        </button>
        <button type="button" className="chat-video-send" onClick={send}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12 20 4l-6.2 16-2.2-6.2L4 12Z" />
          </svg>
          {ru ? 'Отправить' : 'Yuborish'}
        </button>
      </div>
    </>
  );
};

export default ChatVideoReview;
