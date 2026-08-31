/** Server meta.rejectedReason → UI hint key */
export const TARONA_REJECT_REASONS = {
  audio_too_quiet: 'voiceSearch.taronaTooQuiet',
  audio_too_short: 'voiceSearch.taronaTooShort',
  no_confident_match: 'voiceSearch.taronaNoResults',
  ambiguous_match: 'voiceSearch.taronaAmbiguous',
  processing_failed: 'voiceSearch.taronaError',
};

export const getTaronaHintKey = ({ phase, matches, error, rejectReason }) => {
  if (phase === 'recording') return 'voiceSearch.taronaListening';
  if (phase === 'processing') return 'voiceSearch.taronaProcessing';

  if (error?.message === 'empty-audio') {
    return 'voiceSearch.taronaTooShort';
  }

  if (error?.message === 'network-error') {
    return 'voiceSearch.taronaNetworkError';
  }

  if (error?.message && error.message !== 'identify-failed') {
    return 'voiceSearch.taronaError';
  }

  if (rejectReason && TARONA_REJECT_REASONS[rejectReason]) {
    return TARONA_REJECT_REASONS[rejectReason];
  }

  if (phase === 'done' && !matches?.length) {
    return 'voiceSearch.taronaNoResults';
  }

  return 'voiceSearch.taronaHint';
};

export const getTaronaHintDefaults = (key) => {
  const defaults = {
    'voiceSearch.taronaHint':
      'Ilovadagi musiqani boshqa telefonda/kompyuterda ijro qiling. Kamida 7 soniya eshiting.',
    'voiceSearch.taronaListening': 'Eshitilmoqda...',
    'voiceSearch.taronaProcessing': 'Aniqlanmoqda...',
    'voiceSearch.taronaNoResults': 'Mos musiqa topilmadi',
    'voiceSearch.taronaTooQuiet':
      'Ovoz juda past. Musiqani balandroq ijro eting yoki mikrofonni yaqinroq tuting.',
    'voiceSearch.taronaTooShort': 'Yozuv juda qisqa. Kamida 7 soniya musiqa eshiting.',
    'voiceSearch.taronaAmbiguous':
      'Aniq natija topilmadi. Musiqani aniqroq va balandroq ijro qilib qayta urinib ko‘ring.',
    'voiceSearch.taronaMicLow':
      'Mikrofon past eshityapti — musiqani balandroq qiling yoki mikrofonni yaqin tuting',
    'voiceSearch.taronaMicOk': 'Yaxshi eshitilmoqda, kuting...',
    'voiceSearch.taronaNetworkError':
      'Serverga ulanib bo‘lmadi. Internetni tekshiring va qayta urinib ko‘ring.',
    'voiceSearch.taronaError': 'Aniqlashda xatolik. Qayta urinib ko‘ring.',
  };
  return defaults[key] || defaults['voiceSearch.taronaHint'];
};
