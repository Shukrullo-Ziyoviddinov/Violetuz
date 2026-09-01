import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAudioRecorder from './useAudioRecorder';
import useTaronaIdentify from './useTaronaIdentify';
import { getTaronaHintDefaults, getTaronaHintKey } from './taronaMessages';

const VIS_BARS = [18, 32, 48, 28, 56, 36, 44, 24];

const MAX_LISTEN_MS = 40_000;
const FIRST_PROBE_MS = 4_000;
const PROBE_EVERY_MS = 3_500;
/** Musiqa bo‘lmasa mikrofon shovqini — probe yubormaslik */
const MIN_PROBE_MIC_LEVEL = 0.06;

const TaronaModePanel = ({ isOpen, onResults, onProcessingChange }) => {
  const { t } = useTranslation();
  const finalizeStartedRef = useRef(false);
  const peakMicRef = useRef(0);

  const {
    phase,
    matches,
    error: identifyError,
    rejectReason,
    lastMeta,
    probing,
    matchedRef,
    probe,
    finalize,
    reset,
    PHASE_PROCESSING,
    PHASE_DONE,
    PHASE_ERROR,
  } = useTaronaIdentify();

  const handleSnapshot = useCallback(
    async (blob) => {
      if (!blob || matchedRef.current) return;
      // Faqat aniq ovoz eshitilganda serverga yuboramiz (shunchaki tinglash = false positive)
      if (peakMicRef.current < MIN_PROBE_MIC_LEVEL) return;
      const found = await probe(blob);
      if (found) {
        stopRef.current?.({ skipComplete: true });
      }
    },
    [probe, matchedRef]
  );

  const handleComplete = useCallback(
    async (blob) => {
      if (matchedRef.current || finalizeStartedRef.current) return;
      finalizeStartedRef.current = true;
      await finalize(blob);
      finalizeStartedRef.current = false;
    },
    [finalize, matchedRef]
  );

  const { recording, error, start, stop, abort, canStop, remainingSec, peakMicLevel, elapsedMs } =
    useAudioRecorder({
      enabled: isOpen,
      minMs: 2_000,
      maxMs: MAX_LISTEN_MS,
      rawAudio: true,
      firstSnapshotMs: FIRST_PROBE_MS,
      snapshotIntervalMs: PROBE_EVERY_MS,
      onSnapshot: handleSnapshot,
      onComplete: handleComplete,
    });

  const stopRef = useRef(stop);
  stopRef.current = stop;
  peakMicRef.current = peakMicLevel;

  const processing = phase === PHASE_PROCESSING;
  const showVisualizer = recording || processing || probing;

  useEffect(() => {
    onProcessingChange?.(processing);
  }, [processing, onProcessingChange]);

  useEffect(() => {
    if (phase === PHASE_DONE || phase === PHASE_ERROR) {
      onResults?.(matches, phase);
    }
  }, [phase, matches, onResults, PHASE_DONE, PHASE_ERROR, identifyError]);

  useEffect(() => {
    if (!isOpen) {
      abort();
      reset();
      finalizeStartedRef.current = false;
    }
  }, [isOpen, abort, reset]);

  useEffect(() => {
    if (!isOpen || !error) return;
    if (error.error === 'not-allowed' || error.error === 'not-supported') {
      onResults?.([], 'error');
    }
  }, [isOpen, error, onResults]);

  const handleMainButtonClick = useCallback(async () => {
    if (processing) return;

    if (recording) {
      if (!canStop) return;
      await stop();
      return;
    }

    reset();
    finalizeStartedRef.current = false;
    onResults?.([], 'idle');
    await start();
  }, [processing, recording, canStop, stop, reset, start, onResults]);

  const uiPhase = recording || probing ? 'recording' : processing ? 'processing' : phase;
  let hintKey = getTaronaHintKey({
    phase: uiPhase,
    matches,
    error: identifyError,
    rejectReason,
  });
  let hint = t(hintKey, getTaronaHintDefaults(hintKey));

  if (recording || probing) {
    if (probing) {
      hint = t('voiceSearch.taronaSearching', 'Aniqlanmoqda... topilsa darhol chiqadi');
    } else if (peakMicLevel < 0.05) {
      hint = t(
        'voiceSearch.taronaMicLow',
        'Mikrofon musiqani past eshityapti — boshqa telefonda ijro qiling'
      );
    } else if (peakMicLevel < 0.1) {
      hint = t(
        'voiceSearch.taronaMicMedium',
        'Eshitilmoqda, lekin balandroq qiling yoki mikrofonni yaqin tuting'
      );
    } else if (elapsedMs < FIRST_PROBE_MS) {
      hint = t('voiceSearch.taronaMicOk', 'Yaxshi eshitilmoqda...');
    } else {
      hint = t(
        'voiceSearch.taronaListeningLive',
        'Eshitilmoqda... topilishi bilan natija chiqadi (max {{sec}}s)',
        { sec: remainingSec }
      );
    }
  } else if (
    phase === PHASE_DONE &&
    !matches.length &&
    lastMeta?.bestScore != null &&
    lastMeta.bestScore > 0
  ) {
    const pct = Math.round(lastMeta.bestScore * 100);
    hint = t(
      'voiceSearch.taronaLowMatch',
      'Musiqa eshitildi ({{pct}}%), lekin bazada mos yo‘q. Ilovadagi trekni boshqa telefonda ijro qiling.',
      { pct }
    );
  }

  return (
    <>
      <div className="tarona-mode-center">
        <p className="tarona-mode-hint">{hint}</p>
      </div>

      <div className="tarona-mode-bottom">
        <button
          type="button"
          className={`tarona-visualizer-btn${showVisualizer ? ' tarona-visualizer-btn--live' : ''}`}
          onClick={handleMainButtonClick}
          aria-label={t('voiceSearch.taronaListen', 'Musiqani eshitish')}
          aria-pressed={recording}
          disabled={processing || (recording && !canStop)}
        >
          <span className="tarona-visualizer-glow" aria-hidden="true" />
          <span className="tarona-visualizer-core">
            {processing ? (
              <span className="tarona-visualizer-spinner" role="status" />
            ) : (
              <span className="tarona-visualizer-bars" aria-hidden="true">
                {VIS_BARS.map((h, i) => (
                  <span
                    key={i}
                    className="tarona-visualizer-bar"
                    style={{
                      '--bar-h': `${h}px`,
                      '--bar-delay': `${i * 0.07}s`,
                    }}
                  />
                ))}
              </span>
            )}
          </span>
        </button>
      </div>
    </>
  );
};

export default TaronaModePanel;
