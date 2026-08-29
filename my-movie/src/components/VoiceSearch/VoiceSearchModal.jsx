import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSpeechRecognition, {
  cleanSpeechTranscript,
  resolveSpeechLang,
} from './useSpeechRecognition';
import './VoiceSearchModal.css';

const PHASE_LISTENING = 'listening';
const PHASE_PROCESSING = 'processing';
const PHASE_HANDOFF = 'handoff';

const PROCESSING_MS = 900;
const HANDOFF_MS = 450;

const CENTER_BARS = [28, 46, 72, 54, 88, 62, 96, 70, 84, 58, 76, 48, 36];
const SIDE_BARS = [10, 18, 28, 22, 34, 16, 26, 14];
const MINI_BARS = [8, 14, 10, 16, 12, 18, 9];

/**
 * Voice search modal (UI).
 * STT → onResult(text); search algoritmiga tegmaydi.
 */
const VoiceSearchModal = ({ isOpen, onClose, onResult }) => {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState(PHASE_LISTENING);
  const [shownText, setShownText] = useState('');
  const handedOffRef = useRef(false);
  const processingStartedRef = useRef(false);
  const timersRef = useRef([]);
  const cancelRef = useRef(() => {});
  const onResultRef = useRef(onResult);
  const onCloseRef = useRef(onClose);
  onResultRef.current = onResult;
  onCloseRef.current = onClose;

  const speechLang = resolveSpeechLang(i18n.language);
  const {
    listening,
    displayText,
    finalText,
    error,
    start,
    stop,
    abort,
  } = useSpeechRecognition({
    lang: speechLang,
    active: isOpen && phase === PHASE_LISTENING,
  });

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const schedule = (fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const handleCancel = () => {
    clearTimers();
    handedOffRef.current = true;
    abort();
    onClose?.();
  };
  cancelRef.current = handleCancel;

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      handedOffRef.current = false;
      processingStartedRef.current = false;
      setPhase(PHASE_LISTENING);
      setShownText('');
      return undefined;
    }
    handedOffRef.current = false;
    processingStartedRef.current = false;
    setPhase(PHASE_LISTENING);
    setShownText('');
    return () => clearTimers();
  }, [isOpen]);

  /** Final matn keldi yoki listening tugadi + matn bor → processing */
  useEffect(() => {
    if (!isOpen || phase !== PHASE_LISTENING || handedOffRef.current) return;

    const text = cleanSpeechTranscript(finalText || (!listening ? displayText : ''));
    if (!text) return;
    if (listening && !finalText) return;

    stop();
    setShownText(text);
    setPhase(PHASE_PROCESSING);
  }, [isOpen, phase, listening, finalText, displayText, stop]);

  /** Processing → handoff → onResult + close (timerlar cancel/isOpen da tozalanadi) */
  useEffect(() => {
    if (!isOpen || phase !== PHASE_PROCESSING || handedOffRef.current) return;
    if (processingStartedRef.current) return;

    const text = cleanSpeechTranscript(shownText);
    if (!text) {
      setPhase(PHASE_LISTENING);
      return;
    }

    processingStartedRef.current = true;
    schedule(() => setPhase(PHASE_HANDOFF), PROCESSING_MS);
    schedule(() => {
      if (handedOffRef.current) return;
      handedOffRef.current = true;
      onResultRef.current?.(text);
      onCloseRef.current?.();
    }, PROCESSING_MS + HANDOFF_MS);
  }, [isOpen, phase, shownText]);

  useEffect(() => {
    if (!isOpen || !error) return;
    if (error.error === 'not-supported' || error.error === 'not-allowed') {
      onCloseRef.current?.();
    }
  }, [isOpen, error]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      cancelRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [isOpen]);

  const handleMicClick = () => {
    if (phase !== PHASE_LISTENING) return;
    if (listening) {
      stop();
      return;
    }
    start();
  };

  if (!isOpen) return null;

  const livePreview = phase === PHASE_LISTENING ? displayText : shownText;
  const showLoader = phase === PHASE_PROCESSING || phase === PHASE_HANDOFF;
  const statusLabel =
    phase === PHASE_LISTENING
      ? t('voiceSearch.recording', 'Ovoz yozilmoqda...')
      : livePreview || t('voiceSearch.processing', 'Aniqlanmoqda...');

  return (
    <div
      className="voice-search-modal"
      role="dialog"
      aria-modal="true"
      aria-label={t('voiceSearch.title', 'Ovozli qidiruv')}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="voice-search-modal-top">
        <button
          type="button"
          className="voice-search-modal-close"
          onClick={handleCancel}
          aria-label={t('voiceSearch.close', 'Yopish')}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <span
          className={`voice-search-mic-dot${listening ? ' voice-search-mic-dot--on' : ''}`}
          aria-hidden="true"
        />
      </div>

      <div className="voice-search-modal-center">
        <div className="voice-search-ripple-wrap" aria-hidden="true">
          <span className="voice-search-ripple voice-search-ripple--1" />
          <span className="voice-search-ripple voice-search-ripple--2" />
          <span className="voice-search-ripple voice-search-ripple--3" />
          <div
            className={`voice-search-wave${
              phase === PHASE_LISTENING && listening ? ' voice-search-wave--live' : ''
            }`}
          >
            {CENTER_BARS.map((h, i) => (
              <span
                key={`c-${i}`}
                className="voice-search-wave-bar"
                style={{
                  '--bar-h': `${h}px`,
                  '--bar-delay': `${i * 0.05}s`,
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
            <div className="voice-search-mini-wave" aria-hidden="true">
              {MINI_BARS.map((h, i) => (
                <span
                  key={`m-${i}`}
                  className="voice-search-mini-bar"
                  style={{
                    '--bar-h': `${h}px`,
                    '--bar-delay': `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="voice-search-modal-bottom">
        <div className="voice-search-side-wave" aria-hidden="true">
          {SIDE_BARS.map((h, i) => (
            <span
              key={`l-${i}`}
              className="voice-search-side-bar"
              style={{
                '--bar-h': `${h}px`,
                '--bar-delay': `${i * 0.06}s`,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className={`voice-search-mic-btn${
            listening ? ' voice-search-mic-btn--live' : ''
          }`}
          onClick={handleMicClick}
          aria-label={t('voiceSearch.mic', 'Mikrofon')}
          disabled={phase !== PHASE_LISTENING}
        >
          <span className="voice-search-mic-ring voice-search-mic-ring--1" aria-hidden="true" />
          <span className="voice-search-mic-ring voice-search-mic-ring--2" aria-hidden="true" />
          <span className="voice-search-mic-ring voice-search-mic-ring--3" aria-hidden="true" />
          <span className="voice-search-mic-core">
            <i className="fa-solid fa-microphone" aria-hidden="true" />
          </span>
        </button>

        <div className="voice-search-side-wave" aria-hidden="true">
          {SIDE_BARS.map((h, i) => (
            <span
              key={`r-${i}`}
              className="voice-search-side-bar"
              style={{
                '--bar-h': `${h}px`,
                '--bar-delay': `${i * 0.06}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchModal;
