import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAudioRecorder from './useAudioRecorder';
import useTaronaIdentify from './useTaronaIdentify';
import { getTaronaHintDefaults, getTaronaHintKey } from './taronaMessages';

const VIS_BARS = [18, 32, 48, 28, 56, 36, 44, 24];

const TaronaModePanel = ({ isOpen, onResults, onProcessingChange, hideCenterHint = false }) => {
  const { t } = useTranslation();
  const identifyStartedRef = useRef(false);

  const {
    phase,
    matches,
    error: identifyError,
    rejectReason,
    lastMeta,
    identify,
    reset,
    PHASE_PROCESSING,
    PHASE_DONE,
    PHASE_ERROR,
  } = useTaronaIdentify();

  const runIdentify = useCallback(
    async (blob) => {
      if (!blob || identifyStartedRef.current) return;
      identifyStartedRef.current = true;
      await identify(blob);
      identifyStartedRef.current = false;
    },
    [identify]
  );

  const { recording, error, start, stop, abort, canStop, remainingSec, peakMicLevel } =
    useAudioRecorder({
      enabled: isOpen,
      minMs: 7_000,
      maxMs: 12_000,
      rawAudio: true,
      onComplete: runIdentify,
    });

  const processing = phase === PHASE_PROCESSING;
  const showVisualizer = recording || processing;

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
      identifyStartedRef.current = false;
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
    identifyStartedRef.current = false;
    onResults?.([], 'idle');
    await start();
  }, [processing, recording, canStop, stop, reset, start, onResults]);

  const uiPhase = recording ? 'recording' : processing ? 'processing' : phase;
  let hintKey = getTaronaHintKey({
    phase: uiPhase,
    matches,
    error: identifyError,
    rejectReason,
  });
  let hint = t(hintKey, getTaronaHintDefaults(hintKey));

  if (recording) {
    if (peakMicLevel < 0.05) {
      hint = t(
        'voiceSearch.taronaMicLow',
        'Mikrofon musiqani past eshityapti — boshqa telefonda ijro qiling'
      );
    } else if (peakMicLevel < 0.1) {
      hint = t(
        'voiceSearch.taronaMicMedium',
        'Eshitilmoqda, lekin balandroq qiling yoki mikrofonni yaqin tuting'
      );
    } else {
      hint = t(
        'voiceSearch.taronaListening',
        'Eshitilmoqda... {{sec}} soniya qoldi',
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
      {!hideCenterHint ? (
        <div className="tarona-mode-center">
          <p className="tarona-mode-hint">{hint}</p>
        </div>
      ) : null}

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
