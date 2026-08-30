import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSpeechRecognition, {
  cleanSpeechTranscript,
  resolveSpeechLang,
} from './useSpeechRecognition';

const PHASE_IDLE = 'idle';
const PHASE_LISTENING = 'listening';
const PHASE_PROCESSING = 'processing';
const PHASE_HANDOFF = 'handoff';

const PROCESSING_MS = 900;
const HANDOFF_MS = 450;
const STOP_SETTLE_MS = 280;

const CENTER_BARS = [28, 46, 72, 54, 88, 62, 96, 70, 84, 58, 76, 48, 36];
const SIDE_BARS = [10, 18, 28, 22, 34, 16, 26, 14];
const MINI_BARS = [8, 14, 10, 16, 12, 18, 9];

const barPx = (base, live, level, index) => {
  if (!live) return Math.max(5, Math.round(base * 0.28));
  const wave = 0.55 + ((index % 5) / 5) * 0.45;
  const scaled = base * (0.3 + level * 0.85) * wave;
  return Math.max(8, Math.round(scaled));
};

/**
 * Ovoz rejimi — STT → onResult(text). Search algoritmiga tegmaydi.
 */
const VoiceModePanel = ({ isOpen, onResult, onFatalError }) => {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState(PHASE_IDLE);
  const [shownText, setShownText] = useState('');
  const handedOffRef = useRef(false);
  const processingStartedRef = useRef(false);
  const commitOnceRef = useRef(false);
  const stopCommitPendingRef = useRef(false);
  const timersRef = useRef([]);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const speechLang = resolveSpeechLang(i18n.language);

  const {
    listening,
    displayText,
    speaking,
    voiceLevel,
    error,
    start,
    stop,
    abort,
    resetTranscript,
    getCurrentText,
  } = useSpeechRecognition({
    lang: speechLang,
    enabled: isOpen,
  });

  const visualsLive = listening;
  const level = listening ? (speaking ? Math.max(0.55, voiceLevel) : 0.32) : 0;

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const schedule = (fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const commitTranscript = (raw) => {
    const text = cleanSpeechTranscript(raw);
    if (!text || commitOnceRef.current || handedOffRef.current) return false;
    commitOnceRef.current = true;
    stop();
    setShownText(text);
    setPhase(PHASE_PROCESSING);
    return true;
  };

  const tryCommitAfterStop = () => {
    if (stopCommitPendingRef.current) return;
    stopCommitPendingRef.current = true;
    schedule(() => {
      stopCommitPendingRef.current = false;
      if (commitOnceRef.current || handedOffRef.current) return;
      const text = getCurrentText();
      if (text) {
        commitTranscript(text);
        return;
      }
      setPhase(PHASE_IDLE);
    }, STOP_SETTLE_MS);
  };

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      handedOffRef.current = false;
      processingStartedRef.current = false;
      commitOnceRef.current = false;
      stopCommitPendingRef.current = false;
      setPhase(PHASE_IDLE);
      setShownText('');
      abort();
      return undefined;
    }

    handedOffRef.current = false;
    processingStartedRef.current = false;
    commitOnceRef.current = false;
    setPhase(PHASE_IDLE);
    setShownText('');
    resetTranscript();
    return () => clearTimers();
  }, [isOpen, resetTranscript, abort]);

  useEffect(() => {
    if (!isOpen) return;
    if (listening && phase === PHASE_IDLE) {
      setPhase(PHASE_LISTENING);
    }
  }, [isOpen, listening, phase]);

  useEffect(() => {
    if (!isOpen || handedOffRef.current || commitOnceRef.current) return;
    if (phase !== PHASE_LISTENING) return;
    if (!listening) {
      tryCommitAfterStop();
    }
  }, [isOpen, phase, listening]);

  useEffect(() => {
    if (!isOpen || phase !== PHASE_PROCESSING || handedOffRef.current) return;
    if (processingStartedRef.current) return;

    const text = cleanSpeechTranscript(shownText);
    if (!text) {
      commitOnceRef.current = false;
      stopCommitPendingRef.current = false;
      setPhase(PHASE_IDLE);
      return;
    }

    processingStartedRef.current = true;
    schedule(() => setPhase(PHASE_HANDOFF), PROCESSING_MS);
    schedule(() => {
      if (handedOffRef.current) return;
      handedOffRef.current = true;
      onResultRef.current?.(text);
    }, PROCESSING_MS + HANDOFF_MS);
  }, [isOpen, phase, shownText]);

  useEffect(() => {
    if (!isOpen || !error) return;
    if (error.error === 'not-supported' || error.error === 'not-allowed') {
      onFatalError?.(error);
    }
  }, [isOpen, error, onFatalError]);

  const handleMicClick = () => {
    if (phase === PHASE_PROCESSING || phase === PHASE_HANDOFF) return;

    if (listening) {
      stop();
      tryCommitAfterStop();
      return;
    }

    commitOnceRef.current = false;
    processingStartedRef.current = false;
    setShownText('');
    resetTranscript();
    setPhase(PHASE_LISTENING);
    start();
  };

  const livePreview =
    phase === PHASE_LISTENING || phase === PHASE_IDLE ? displayText : shownText;
  const showLoader = phase === PHASE_PROCESSING || phase === PHASE_HANDOFF;

  let statusLabel = t('voiceSearch.tapMic', 'Mikrofonni bosing');
  if (phase === PHASE_LISTENING || listening) {
    statusLabel = t('voiceSearch.recording', 'Ovoz yozilmoqda...');
  }
  if (showLoader) {
    statusLabel = livePreview || t('voiceSearch.processing', 'Aniqlanmoqda...');
  }

  const waveClass = visualsLive ? ' voice-search-wave--live' : '';
  const miniClass = visualsLive ? ' voice-search-mini-wave--live' : '';
  const sideClass = visualsLive ? ' voice-search-side-wave--live' : '';
  const rippleClass = visualsLive ? ' voice-search-ripple-wrap--live' : '';

  return (
    <>
      <div className="voice-search-modal-center">
        <div className={`voice-search-ripple-wrap${rippleClass}`} aria-hidden="true">
          <span className="voice-search-ripple voice-search-ripple--1" />
          <span className="voice-search-ripple voice-search-ripple--2" />
          <span className="voice-search-ripple voice-search-ripple--3" />
          <div className={`voice-search-wave${waveClass}`}>
            {CENTER_BARS.map((h, i) => (
              <span
                key={`c-${i}`}
                className="voice-search-wave-bar"
                style={{
                  height: `${barPx(h, visualsLive, level, i)}px`,
                  '--bar-h': `${h}px`,
                  '--bar-delay': `${i * 0.04}s`,
                }}
              />
            ))}
          </div>
        </div>

        {showLoader ? (
          <div className="voice-search-status voice-search-status--processing">
            <div className="voice-search-loader" role="status" aria-live="polite" />
            {livePreview ? (
              <p className="voice-search-transcript">{livePreview}</p>
            ) : (
              <p className="voice-search-status-text">
                {t('voiceSearch.processing', 'Aniqlanmoqda...')}
              </p>
            )}
          </div>
        ) : (
          <div className="voice-search-status">
            <p className="voice-search-status-text">{statusLabel}</p>
            {livePreview ? (
              <p className="voice-search-transcript voice-search-transcript--live">
                {livePreview}
              </p>
            ) : null}
            <div className={`voice-search-mini-wave${miniClass}`} aria-hidden="true">
              {MINI_BARS.map((h, i) => (
                <span
                  key={`m-${i}`}
                  className="voice-search-mini-bar"
                  style={{
                    height: `${barPx(h, visualsLive, level, i)}px`,
                    '--bar-h': `${h}px`,
                    '--bar-delay': `${i * 0.06}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="voice-search-modal-bottom">
        <div className={`voice-search-side-wave${sideClass}`} aria-hidden="true">
          {SIDE_BARS.map((h, i) => (
            <span
              key={`l-${i}`}
              className="voice-search-side-bar"
              style={{
                height: `${barPx(h, visualsLive, level, i)}px`,
                '--bar-h': `${h}px`,
                '--bar-delay': `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className={`voice-search-mic-btn${listening ? ' voice-search-mic-btn--live' : ''}`}
          onClick={handleMicClick}
          aria-label={t('voiceSearch.mic', 'Mikrofon')}
          aria-pressed={listening}
          disabled={phase === PHASE_PROCESSING || phase === PHASE_HANDOFF}
        >
          <span
            className={`voice-search-mic-core${
              listening ? '' : ' voice-search-mic-core--muted'
            }`}
          >
            <i className="fa-solid fa-microphone" aria-hidden="true" />
          </span>
        </button>

        <div className={`voice-search-side-wave${sideClass}`} aria-hidden="true">
          {SIDE_BARS.map((h, i) => (
            <span
              key={`r-${i}`}
              className="voice-search-side-bar"
              style={{
                height: `${barPx(h, visualsLive, level, i)}px`,
                '--bar-h': `${h}px`,
                '--bar-delay': `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default VoiceModePanel;
