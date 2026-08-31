import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAudioRecorder from './useAudioRecorder';
import useTaronaIdentify from './useTaronaIdentify';
import { getTaronaHintDefaults, getTaronaHintKey } from './taronaMessages';

const VIS_BARS = [18, 32, 48, 28, 56, 36, 44, 24];

const TaronaModePanel = ({ isOpen, onResults, onProcessingChange }) => {
  const { t } = useTranslation();
  const identifyStartedRef = useRef(false);

  const {
    phase,
    matches,
    error: identifyError,
    rejectReason,
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

  const { recording, error, start, stop, abort } = useAudioRecorder({
    enabled: isOpen,
    maxMs: 10_000,
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
      await stop();
      return;
    }

    reset();
    identifyStartedRef.current = false;
    onResults?.([], 'idle');
    await start();
  }, [processing, recording, stop, reset, start, onResults]);

  const uiPhase = recording ? 'recording' : processing ? 'processing' : phase;
  const hintKey = getTaronaHintKey({
    phase: uiPhase,
    matches,
    error: identifyError,
    rejectReason,
  });
  const hint = t(hintKey, getTaronaHintDefaults(hintKey));

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
          disabled={processing}
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
