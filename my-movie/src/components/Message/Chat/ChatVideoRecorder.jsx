import React, { useEffect, useRef, useState } from 'react';
import { useModalHardwareBack } from '../../../useModalHardwareBack';
import ChatVideoReview from './ChatVideoReview';
import './ChatVideoRecorder.css';

const MAX_MS = 60_000;
const RING_R = 34;
const RING = 2 * Math.PI * RING_R;

const mimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

const ChatVideoRecorder = ({ lang, peerName = '', onClose, onSend }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const ringRef = useRef(null);
  const frameRef = useRef(0);
  const fullRef = useRef(false);
  const drawRef = useRef(0);
  const startedRef = useRef(0);
  const reviewRef = useRef(false);
  const stopRef = useRef(() => {});
  const closeRef = useRef(onClose);
  const backRef = useRef(() => {});
  const phaseRef = useRef('record');
  const [facing, setFacing] = useState('user');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [flash, setFlash] = useState(false);
  const [full, setFull] = useState(false);
  const [phase, setPhase] = useState('record');
  const [clip, setClip] = useState(null);
  const ru = lang === 'ru';
  phaseRef.current = phase;

  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'violetChatVideo',
    isOpen: true,
    hasNested: phase === 'review',
    onNestedBack: () => backRef.current(),
    onCloseFromHardware: onClose,
  });

  const paintRing = (ratio) => {
    const node = ringRef.current;
    if (!node) return;
    node.style.strokeDashoffset = String(RING * (1 - Math.min(1, Math.max(0, ratio))));
  };

  const stopRecording = (review) => {
    reviewRef.current = review === true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    if (drawRef.current) cancelAnimationFrame(drawRef.current);
    drawRef.current = 0;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecording(false);
    paintRing(0);
  };
  stopRef.current = stopRecording;
  closeRef.current = onClose;

  useEffect(() => {
    if (phase !== 'record') return undefined;
    let cancelled = false;
    let stream = null;
    setReady(false);
    setError('');
    setFlash(false);
    const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(ru ? 'Камера недоступна' : 'Kamera yo‘q');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } },
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: facing },
          });
        } catch {
          if (!cancelled) setError(ru ? 'Камера не открылась' : 'Kamera ochilmadi');
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const zoom = track?.getCapabilities?.().zoom;
      if (zoom && track.applyConstraints) {
        try {
          await track.applyConstraints({ advanced: [{ zoom: zoom.min ?? 1 }] });
        } catch {
          /* keng kadr qoladi */
        }
      }
      if (videoRef.current) videoRef.current.srcObject = stream;
      setReady(true);
    };
    openCamera();
    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (drawRef.current) cancelAnimationFrame(drawRef.current);
      drawRef.current = 0;
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      stream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
    };
  }, [facing, phase, ru]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (phaseRef.current === 'review') {
        backRef.current();
        return;
      }
      stopRef.current(false);
      closeRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || recorderRef.current) return;
    const source = framedStream(stream);
    let recorder;
    try {
      const type = mimeType();
      recorder = new MediaRecorder(source, type ? { mimeType: type } : undefined);
    } catch {
      if (drawRef.current) cancelAnimationFrame(drawRef.current);
      drawRef.current = 0;
      setError(ru ? 'Запись недоступна' : 'Yozib bo‘lmadi');
      return;
    }
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      const seconds = Math.min(60, Math.max(0, (performance.now() - startedRef.current) / 1000));
      if (!reviewRef.current || !blob.size) return;
      const url = URL.createObjectURL(blob);
      setClip({ url, blob, type: blob.type || 'video/webm', seconds });
      setPhase('review');
    };
    recorderRef.current = recorder;
    try {
      recorder.start(200);
    } catch {
      recorderRef.current = null;
      if (drawRef.current) cancelAnimationFrame(drawRef.current);
      drawRef.current = 0;
      setError(ru ? 'Запись недоступна' : 'Yozib bo‘lmadi');
      return;
    }
    startedRef.current = performance.now();
    setRecording(true);
    const tick = (now) => {
      const ratio = (now - startedRef.current) / MAX_MS;
      paintRing(ratio);
      if (ratio >= 1) {
        stopRecording(true);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const holdStart = (event) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startRecording();
  };

  const holdEnd = (event) => {
    event.preventDefault();
    stopRecording(true);
  };

  const flipCamera = () => {
    if (recording) return;
    setFacing((current) => (current === 'user' ? 'environment' : 'user'));
  };

  const toggleFull = () => {
    if (recording) return;
    setFull((current) => !current);
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    const next = !flash;
    const canTorch = Boolean(track?.getCapabilities?.().torch);
    if (!canTorch) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setFlash(next);
    } catch {
      setFlash(false);
    }
  };

  const close = () => {
    stopRecording(false);
    releaseHistory();
    onClose?.();
  };

  const retake = () => {
    setClip((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
    setPhase('record');
  };
  backRef.current = retake;

  const clipRef = useRef(null);
  clipRef.current = clip;
  fullRef.current = full;

  const framedStream = (stream) => {
    const video = videoRef.current;
    const stage = video?.closest('.chat-video-stage');
    if (!video?.videoWidth || !stage || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return stream;
    const rect = stage.getBoundingClientRect();
    const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 9 / 16;
    const height = 1280;
    const width = Math.max(2, Math.round(height * aspect));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const paint = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw && vh) {
        const scale = Math.max(width / vw, height / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(video, (width - dw) / 2, (height - dh) / 2, dw, dh);
      }
      drawRef.current = requestAnimationFrame(paint);
    };
    paint();
    const captured = canvas.captureStream(30);
    stream.getAudioTracks().forEach((track) => captured.addTrack(track));
    return captured;
  };

  useEffect(() => () => {
    if (clipRef.current?.url) URL.revokeObjectURL(clipRef.current.url);
  }, []);

  if (phase === 'review' && clip) {
    return (
      <div className="chat-video is-review" role="dialog" aria-modal="true" aria-label={ru ? 'Просмотр' : 'Ko‘rib chiqish'}>
        <ChatVideoReview
          lang={lang}
          peerName={peerName}
          clip={clip}
          onBack={retake}
          onSend={(item) => onSend?.(item)}
        />
      </div>
    );
  }

  return (
    <div className={`chat-video${full ? ' is-full' : ''}`} role="dialog" aria-modal="true" aria-label={ru ? 'Видеосообщение' : 'Video xabar'}>
      <header className="chat-video-bar">
        <button type="button" className="chat-video-icon" onClick={close} aria-label={ru ? 'Закрыть' : 'Yopish'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <h2>{ru ? 'Видеосообщение' : 'Video xabar'}</h2>
        <button
          type="button"
          className={`chat-video-icon${flash ? ' is-on' : ''}`}
          onClick={toggleFlash}
          aria-pressed={flash}
          aria-label={ru ? 'Вспышка' : 'Chaqnoq'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 3 6 13h6l-1 8 7-10h-6l1-8Z" />
          </svg>
        </button>
      </header>
      <div className="chat-video-fit">
        <div className="chat-video-slot">
          <div className={`chat-video-stage${facing === 'user' ? ' is-mirror' : ''}`}>
            <video ref={videoRef} className="chat-video-preview" playsInline muted autoPlay />
            {ready ? null : (
              <span className="chat-video-person" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5.5 19.2c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
                </svg>
              </span>
            )}
            <span className="chat-video-dash" aria-hidden="true" />
            {error ? <p className="chat-video-error">{error}</p> : null}
          </div>
        </div>
        <div className="chat-video-dock">
        <p className="chat-video-hint">{ru ? 'Удерживайте для записи и отпустите, чтобы остановить' : 'Bosib turib yozing, qo‘yib yuborsangiz yuboriladi'}</p>
        <p className="chat-video-limit">{ru ? 'Не дольше 1 минуты' : 'Eng ko‘pi bilan 1 daqiqa'}</p>
        <div className="chat-video-controls">
          <button type="button" className="chat-video-side" onClick={flipCamera} disabled={recording} aria-label={ru ? 'Сменить камеру' : 'Kamerani almashtirish'}>
            <i className="fa-solid fa-camera-rotate" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`chat-video-record${recording ? ' is-recording' : ''}`}
            aria-label={ru ? 'Запись' : 'Yozish'}
            onPointerDown={holdStart}
            onPointerUp={holdEnd}
            onPointerCancel={holdEnd}
            onContextMenu={(event) => event.preventDefault()}
          >
            <svg className="chat-video-ring" viewBox="0 0 84 84" aria-hidden="true">
              <circle className="chat-video-ring-track" cx="42" cy="42" r={RING_R} />
              <circle
                ref={ringRef}
                className="chat-video-ring-fill"
                cx="42"
                cy="42"
                r={RING_R}
                style={{ strokeDasharray: RING, strokeDashoffset: RING }}
              />
            </svg>
            <span className="chat-video-core" />
          </button>
          <button
            type="button"
            className="chat-video-side"
            onClick={toggleFull}
            disabled={recording}
            aria-pressed={full}
            aria-label={full ? (ru ? 'Обычный размер' : 'Oddiy o‘lcham') : (ru ? 'На весь экран' : 'To‘liq ekran')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {full ? (
                <path d="M9 9H4M9 9V4M15 9h5M15 9V4M9 15H4M9 15v5M15 15h5M15 15v5" />
              ) : (
                <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ChatVideoRecorder;
