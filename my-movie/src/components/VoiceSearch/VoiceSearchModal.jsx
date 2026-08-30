import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalHardwareBack } from '../../useModalHardwareBack';
import VoiceModeToggle from './VoiceModeToggle';
import VoiceModePanel from './VoiceModePanel';
import TaronaModePanel from './TaronaModePanel';
import TaronaResults from './TaronaResults';
import { VOICE_SEARCH_MODE_TARONA, VOICE_SEARCH_MODE_VOICE } from './voiceSearchModes';
import { isSpeechRecognitionSupported, isTaronaIdentifySupported } from './voiceSearchSupport';
import './VoiceSearchModal.css';

/**
 * Voice search shell: Ovoz (STT → search input) | Tarona (audio identify → modal natija).
 */
const VoiceSearchModal = ({ isOpen, onClose, onResult, onMusicSelect }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState(VOICE_SEARCH_MODE_VOICE);
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [exitMode, setExitMode] = useState('slide');
  const [taronaMatches, setTaronaMatches] = useState([]);
  const [taronaShowResults, setTaronaShowResults] = useState(false);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const voiceSupported = isSpeechRecognitionSupported();
  const taronaSupported = isTaronaIdentifySupported();

  const visible = isOpen || exiting;
  const slideIn = entered && !exiting;
  const isTarona = mode === VOICE_SEARCH_MODE_TARONA;

  const finishAnimatedClose = () => {
    if (!closingRef.current) return;
    closingRef.current = false;
    setExiting(false);
    setEntered(false);
    setExitMode('slide');
    onCloseRef.current?.();
  };

  const beginAnimatedClose = (closeMode = 'slide') => {
    if (closingRef.current || exiting) return;
    closingRef.current = true;
    setExitMode(closeMode);
    setExiting(true);
  };

  const dismissWithSlide = useCallback(() => {
    if (closingRef.current || exiting) return;
    beginAnimatedClose('slide');
  }, [exiting]);

  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'violetVoiceSearch',
    isOpen: isOpen && !exiting,
    onCloseFromHardware: dismissWithSlide,
  });

  const handleVoiceResult = useCallback(
    (text) => {
      onResult?.(text);
      beginAnimatedClose('handoff');
      releaseHistory();
    },
    [onResult, releaseHistory]
  );

  const handleTaronaResults = useCallback((matches, phase) => {
    if (phase === 'idle') {
      setTaronaMatches([]);
      setTaronaShowResults(false);
      return;
    }
    setTaronaMatches(matches || []);
    setTaronaShowResults(phase === 'done' || (phase === 'error' && !matches?.length));
  }, []);

  const handleMusicSelect = useCallback(
    (item) => {
      onMusicSelect?.(item);
      dismissWithSlide();
      releaseHistory();
    },
    [onMusicSelect, dismissWithSlide, releaseHistory]
  );

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setTaronaMatches([]);
    setTaronaShowResults(false);
  };

  useEffect(() => {
    if (!isOpen) {
      closingRef.current = false;
      setExiting(false);
      setEntered(false);
      setExitMode('slide');
      setTaronaMatches([]);
      setTaronaShowResults(false);
      return undefined;
    }

    if (!voiceSupported && taronaSupported) {
      setMode(VOICE_SEARCH_MODE_TARONA);
    } else {
      setMode(VOICE_SEARCH_MODE_VOICE);
    }

    closingRef.current = false;
    setExiting(false);
    setEntered(false);
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      window.cancelAnimationFrame(innerId);
    };
  }, [isOpen, voiceSupported, taronaSupported]);

  useEffect(() => {
    if (!exiting) return undefined;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delayMs = reduced ? 0 : exitMode === 'handoff' ? 520 : 380;
    const id = window.setTimeout(finishAnimatedClose, delayMs);
    return () => window.clearTimeout(id);
  }, [exiting, exitMode]);

  const handleModalTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!exiting) return;
    if (exitMode === 'handoff') {
      if (
        e.propertyName !== 'opacity' &&
        e.propertyName !== 'transform' &&
        e.propertyName !== 'filter'
      ) {
        return;
      }
    } else if (e.propertyName !== 'transform') {
      return;
    }
    finishAnimatedClose();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      dismissWithSlide();
      releaseHistory();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [isOpen, dismissWithSlide, releaseHistory]);

  if (!visible) return null;

  const modalClass = [
    'voice-search-modal',
    slideIn && 'voice-search-modal--in',
    exiting && exitMode === 'handoff' && 'voice-search-modal--exit-handoff',
    isTarona && 'voice-search-modal--tarona',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={modalClass}
      role="dialog"
      aria-modal="true"
      aria-label={t('voiceSearch.title', 'Ovozli qidiruv')}
      onClick={(e) => e.stopPropagation()}
      onTransitionEnd={handleModalTransitionEnd}
    >
      <div className="voice-search-modal-top">
        <button
          type="button"
          className="voice-search-modal-close"
          onClick={() => {
            dismissWithSlide();
            releaseHistory();
          }}
          aria-label={t('voiceSearch.close', 'Yopish')}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        {(voiceSupported || taronaSupported) && (
          <VoiceModeToggle
            mode={mode}
            onChange={handleModeChange}
            voiceDisabled={!voiceSupported}
          />
        )}
      </div>

      {isTarona && taronaShowResults ? (
        <TaronaResults matches={taronaMatches} onSelect={handleMusicSelect} />
      ) : null}

      <div className="voice-search-modal-body">
        {isTarona ? (
          <TaronaModePanel isOpen={isOpen && !exiting} onResults={handleTaronaResults} />
        ) : (
          <VoiceModePanel
            isOpen={isOpen && !exiting}
            onResult={handleVoiceResult}
            onFatalError={dismissWithSlide}
          />
        )}
      </div>
    </div>
  );
};

export default VoiceSearchModal;
