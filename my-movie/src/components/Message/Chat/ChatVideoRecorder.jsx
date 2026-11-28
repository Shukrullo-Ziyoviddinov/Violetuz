import React, { useEffect, useRef, useState } from 'react';
import { BeautyEffectStrip, getBeautyPresetStrip, useBeautyEngine } from '../../../features/beauty-engine';
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

const recordingStream = (camera, processedTrack) => {
  if (!camera) return null;
  const cameraVideo = camera.getVideoTracks?.()[0] || null;
  const audioTracks = camera.getAudioTracks?.() || [];
  if (!processedTrack || processedTrack === cameraVideo || processedTrack.readyState === 'ended') return camera;
  try {
    return new MediaStream([processedTrack, ...audioTracks]);
  } catch {
    return camera;
  }
};

const ChatVideoRecorder = ({ lang, peerName = '', onClose, onSend }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const ringRef = useRef(null);
  const frameRef = useRef(0);
  const zoomRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
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
  const [holding, setHolding] = useState(false);
  const [flash, setFlash] = useState(false);
  const [frameRatio, setFrameRatio] = useState(() => (
    window.innerHeight > window.innerWidth ? 9 / 16 : 16 / 9
  ));
  const [phase, setPhase] = useState('record');
  const [clip, setClip] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const ru = lang === 'ru';
  const { settings, setPreset, processedStream, processedVideoTrack } = useBeautyEngine({
    inputStream: cameraStream,
  });
  const processedTrackRef = useRef(null);
  processedTrackRef.current = processedVideoTrack;
  const presets = getBeautyPresetStrip(ru ? 'ru' : 'uz');
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
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
      setCameraStream(stream);
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() || {};
      if (caps.zoom && track.applyConstraints) {
        const min = caps.zoom.min ?? 1;
        zoomRef.current = { min, max: caps.zoom.max ?? min, step: caps.zoom.step || 0.1, value: min };
        try {
          await track.applyConstraints({ advanced: [{ zoom: min }] });
        } catch {
          zoomRef.current = null;
        }
      } else {
        zoomRef.current = null;
      }
      setReady(true);
    };
    openCamera();
    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      zoomRef.current = null;
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      stream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
      setCameraStream((current) => (current === stream ? null : current));
    };
  }, [facing, phase, ru]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== 'record') return undefined;
    const next = processedStream || cameraStream || null;
    if (video.srcObject === next) return undefined;
    video.srcObject = next;
    if (!next) return undefined;
    const pending = video.play?.();
    pending?.catch?.(() => {});
    return undefined;
  }, [processedStream, cameraStream, phase]);

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
    const stream = recordingStream(streamRef.current, processedTrackRef.current);
    if (!stream || recorderRef.current) return;
    let recorder;
    try {
      const type = mimeType();
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    } catch {
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
    setHolding(true);
    startRecording();
  };

  const holdEnd = (event) => {
    event.preventDefault();
    setHolding(false);
    stopRecording(true);
  };

  const flipCamera = () => {
    if (recording) return;
    setFacing((current) => (current === 'user' ? 'environment' : 'user'));
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

  const syncFrame = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    setFrameRatio(video.videoWidth / video.videoHeight);
  };

  const applyZoom = (value) => {
    const range = zoomRef.current;
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!range || !track?.applyConstraints) return;
    const next = Math.min(range.max, Math.max(range.min, value));
    if (Math.abs(next - range.value) < range.step / 2) return;
    range.value = next;
    track.applyConstraints({ advanced: [{ zoom: next }] }).catch(() => {});
  };

  const onStagePointerDown = (event) => {
    if (!zoomRef.current) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: zoomRef.current.value };
    }
  };

  const onStagePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!pinchRef.current || pointersRef.current.size < 2) return;
    const [a, b] = [...pointersRef.current.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    applyZoom(pinchRef.current.zoom * (dist / pinchRef.current.dist));
  };

  const onStagePointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  const onStageWheel = (event) => {
    const range = zoomRef.current;
    if (!range) return;
    event.preventDefault();
    const step = range.step * (event.deltaY > 0 ? -2 : 2);
    applyZoom(range.value + step);
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
    <div className="chat-video is-full" style={{ '--cam-ratio': frameRatio }} role="dialog" aria-modal="true" aria-label={ru ? 'Видеосообщение' : 'Video xabar'}>
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
          <div
            className={`chat-video-stage${facing === 'user' ? ' is-mirror' : ''}`}
            onPointerDown={onStagePointerDown}
            onPointerMove={onStagePointerMove}
            onPointerUp={onStagePointerEnd}
            onPointerCancel={onStagePointerEnd}
            onWheel={onStageWheel}
          >
            <video ref={videoRef} className="chat-video-preview" playsInline muted autoPlay onLoadedMetadata={syncFrame} />
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
            <div className="chat-video-dock">
        <div className="chat-video-effects">
          <BeautyEffectStrip
            effects={presets}
            value={settings.preset}
            onChange={setPreset}
            locked={holding || recording}
            ariaLabel={ru ? 'Эффекты' : 'Effektlar'}
          />
        </div>
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
            disabled={recording}
            aria-label={ru ? 'Галерея' : 'Galereya'}
          >
            <i className="fa-solid fa-images" aria-hidden="true" />
          </button>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatVideoRecorder;
