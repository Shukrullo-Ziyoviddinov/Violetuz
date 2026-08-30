import React from 'react';
import { useTranslation } from 'react-i18next';
import { VOICE_SEARCH_MODE_TARONA, VOICE_SEARCH_MODE_VOICE } from './voiceSearchModes';

const VoiceModeToggle = ({
  mode,
  onChange,
  voiceDisabled = false,
  taronaDisabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="voice-search-mode-toggle" role="tablist" aria-label={t('voiceSearch.modeToggle', 'Qidiruv turi')}>
      <button
        type="button"
        role="tab"
        aria-selected={mode === VOICE_SEARCH_MODE_VOICE}
        className={`voice-search-mode-btn${
          mode === VOICE_SEARCH_MODE_VOICE ? ' voice-search-mode-btn--active' : ''
        }`}
        onClick={() => onChange(VOICE_SEARCH_MODE_VOICE)}
        disabled={voiceDisabled}
      >
        <i className="fa-solid fa-microphone" aria-hidden="true" />
        <span>{t('voiceSearch.modeVoice', 'Ovoz')}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === VOICE_SEARCH_MODE_TARONA}
        className={`voice-search-mode-btn${
          mode === VOICE_SEARCH_MODE_TARONA ? ' voice-search-mode-btn--active' : ''
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
