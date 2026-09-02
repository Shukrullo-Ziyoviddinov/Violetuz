import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VOICE_SEARCH_MODE_TARONA, VOICE_SEARCH_MODE_VOICE } from './voiceSearchModes';

const VoiceModeToggle = ({
  mode,
  onChange,
  voiceDisabled = false,
  taronaDisabled = false,
}) => {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const voiceBtnRef = useRef(null);
  const taronaBtnRef = useRef(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });

  const isVoice = mode === VOICE_SEARCH_MODE_VOICE;

  useLayoutEffect(() => {
    const track = trackRef.current;
    const activeBtn = isVoice ? voiceBtnRef.current : taronaBtnRef.current;
    if (!track || !activeBtn) return undefined;

    const updateThumb = () => {
      const trackRect = track.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setThumb({
        left: btnRect.left - trackRect.left,
        width: btnRect.width,
        ready: true,
      });
    };

    updateThumb();

    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateThumb) : null;
    ro?.observe(track);
    ro?.observe(activeBtn);
    window.addEventListener('resize', updateThumb);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateThumb);
    };
  }, [isVoice, t]);

  return (
    <div
      ref={trackRef}
      className="voice-search-mode-toggle"
      role="tablist"
      aria-label={t('voiceSearch.modeToggle', 'Qidiruv turi')}
    >
      <span
        className={`voice-search-mode-thumb${thumb.ready ? ' is-ready' : ''}`}
        style={{
          width: thumb.width ? `${thumb.width}px` : undefined,
          transform: `translateX(${thumb.left}px)`,
        }}
        aria-hidden="true"
      />
      <button
        ref={voiceBtnRef}
        type="button"
        role="tab"
        aria-selected={isVoice}
        className={`voice-search-mode-btn${isVoice ? ' voice-search-mode-btn--active' : ''}`}
        onClick={() => onChange(VOICE_SEARCH_MODE_VOICE)}
        disabled={voiceDisabled}
      >
        <i className="fa-solid fa-microphone" aria-hidden="true" />
        <span>{t('voiceSearch.modeVoice', 'Ovoz')}</span>
      </button>
      <button
        ref={taronaBtnRef}
        type="button"
        role="tab"
        aria-selected={!isVoice}
        className={`voice-search-mode-btn${
          !isVoice ? ' voice-search-mode-btn--active' : ''
        }`}
        onClick={() => onChange(VOICE_SEARCH_MODE_TARONA)}
        disabled={taronaDisabled}
      >
        <i className="fa-solid fa-music" aria-hidden="true" />
        <span>{t('voiceSearch.modeTarona', 'Tarona')}</span>
      </button>
    </div>
  );
};

export default VoiceModeToggle;
