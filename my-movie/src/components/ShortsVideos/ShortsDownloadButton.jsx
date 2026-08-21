import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatActionCount } from '../../utils/utils';
import {
  fetchShortDownloadCount,
  recordShortDownloadRequest,
} from '../../api/shortDownloadsApi';
import './ShortsDownloadButton.css';

const PHASE = {
  IDLE: 'idle',
  LOADING: 'loading',
  DONE: 'done',
  REVERTING: 'reverting',
};

const RING_SIZE = 28;
const RING_STROKE = 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const DONE_HOLD_MS = 900;
const REVERT_MS = 650;

/**
 * Shorts sidebar — R2 dan to‘g‘ridan-to‘g‘ri yuklash.
 * Progress % + aylanma bar; 100% → pitichka → yana download icon.
 * Count har muvaffaqiyatli yuklashda +1.
 */
const ShortsDownloadButton = ({
  videoUrl,
  shortsId,
  shortType = 'movieShorts',
  fileName,
}) => {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [progress, setProgress] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const abortRef = useRef(null);
  const doneTimerRef = useRef(null);
  const revertTimerRef = useRef(null);

  useEffect(() => {
    if (shortsId == null || shortsId === '') {
      setDownloadCount(0);
      return undefined;
    }
    let cancelled = false;
    fetchShortDownloadCount({ id: shortsId, type: shortType })
      .then((data) => {
        if (!cancelled) setDownloadCount(Number(data?.downloadCount) || 0);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [shortsId, shortType]);

  useEffect(() => {
    setPhase(PHASE.IDLE);
    setProgress(0);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (doneTimerRef.current) {
      window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
    if (revertTimerRef.current) {
      window.clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }
  }, [shortsId, videoUrl]);

  useEffect(
    () => () => {
      if (abortRef.current) abortRef.current.abort();
      if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current);
      if (revertTimerRef.current) window.clearTimeout(revertTimerRef.current);
    },
    []
  );

  const triggerBrowserDownload = useCallback((blob, name) => {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = name || 'shorts.mp4';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  }, []);

  const finishSuccess = useCallback(async () => {
    setProgress(100);
    setPhase(PHASE.DONE);
    try {
      const data = await recordShortDownloadRequest({
        id: shortsId,
        type: shortType,
      });
      if (data?.downloadCount != null) {
        setDownloadCount(Number(data.downloadCount) || 0);
      } else {
        setDownloadCount((c) => c + 1);
      }
    } catch {
      setDownloadCount((c) => c + 1);
    }
    doneTimerRef.current = window.setTimeout(() => {
      setPhase(PHASE.REVERTING);
      doneTimerRef.current = null;
      revertTimerRef.current = window.setTimeout(() => {
        setPhase(PHASE.IDLE);
        setProgress(0);
        revertTimerRef.current = null;
      }, REVERT_MS);
    }, DONE_HOLD_MS);
  }, [shortsId, shortType]);

  const handleDownload = useCallback(
    async (e) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      if (phase !== PHASE.IDLE) return;
      if (!videoUrl) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setPhase(PHASE.LOADING);
      setProgress(0);

      try {
        const res = await fetch(videoUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const total = Number(res.headers.get('content-length')) || 0;
        const reader = res.body?.getReader?.();

        if (!reader) {
          const blob = await res.blob();
          setProgress(100);
          triggerBrowserDownload(
            blob,
            fileName || `shorts-${shortsId || 'video'}.mp4`
          );
          await finishSuccess();
          return;
        }

        const chunks = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.byteLength;
          if (total > 0) {
            setProgress(Math.min(99, Math.floor((received / total) * 100)));
          } else {
            setProgress((p) => (p < 90 ? p + 1 : p));
          }
        }

        const blob = new Blob(chunks, {
          type: res.headers.get('content-type') || 'video/mp4',
        });
        triggerBrowserDownload(
          blob,
          fileName || `shorts-${shortsId || 'video'}.mp4`
        );
        await finishSuccess();
      } catch (err) {
        if (err?.name === 'AbortError') return;
        /* CORS yoki tarmoq — fallback: to‘g‘ridan ochish (progress yo‘q) */
        try {
          const a = document.createElement('a');
          a.href = videoUrl;
          a.download = fileName || `shorts-${shortsId || 'video'}.mp4`;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          a.remove();
          await finishSuccess();
        } catch {
          setPhase(PHASE.IDLE);
          setProgress(0);
        }
      } finally {
        abortRef.current = null;
      }
    },
    [phase, videoUrl, fileName, shortsId, triggerBrowserDownload, finishSuccess]
  );

  const dashOffset = RING_CIRC * (1 - Math.min(100, Math.max(0, progress)) / 100);
  const showCount = downloadCount > 0;
  const showRing =
    phase === PHASE.LOADING || phase === PHASE.DONE || phase === PHASE.REVERTING;
  const showCheck = phase === PHASE.DONE || phase === PHASE.REVERTING;
  const showDownloadIcon = phase === PHASE.IDLE || phase === PHASE.REVERTING;

  return (
    <button
      type="button"
      className={`shorts-modal-action-btn shorts-download-btn${
        phase === PHASE.LOADING ? ' is-loading' : ''
      }${phase === PHASE.DONE ? ' is-done' : ''}${
        phase === PHASE.REVERTING ? ' is-reverting' : ''
      }`}
      onClick={handleDownload}
      disabled={phase !== PHASE.IDLE}
      aria-label="Yuklab olish"
      title="Yuklab olish"
    >
      <span className="shorts-download-icon-wrap" aria-hidden="true">
        {showRing && (
          <svg
            className="shorts-download-ring"
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          >
            <circle
              className="shorts-download-ring-track"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
            />
            <circle
              className="shorts-download-ring-progress"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRC}
              strokeDashoffset={
                phase === PHASE.DONE || phase === PHASE.REVERTING ? 0 : dashOffset
              }
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </svg>
        )}

        <span className="shorts-download-face">
          {phase === PHASE.LOADING ? (
            <span className="shorts-download-pct">{progress}%</span>
          ) : (
            <>
              {showCheck ? (
                <svg
                  className={`shorts-download-check${
                    phase === PHASE.REVERTING ? ' is-out' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : null}
              {showDownloadIcon ? (
                <svg
                  className={`shorts-download-icon${
                    phase === PHASE.REVERTING ? ' is-in' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              ) : null}
            </>
          )}
        </span>
      </span>
      {showCount ? (
        <span className="shorts-modal-action-count">{formatActionCount(downloadCount)}</span>
      ) : null}
    </button>
  );
};

export default ShortsDownloadButton;
