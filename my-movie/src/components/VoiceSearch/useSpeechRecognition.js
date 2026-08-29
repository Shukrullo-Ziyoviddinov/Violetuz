import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API — ovoz → matn.
 * getUserMedia meter YO‘Q (STT bilan conflict qilmasin).
 */

export const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => Boolean(getSpeechRecognitionCtor());

/**
 * STT tili. uz-UZ ko‘p brauzerda zaif — ru-RU/tr-TR zaxira.
 */
export const resolveSpeechLang = (appLang = 'uz') => {
  const code = String(appLang || 'uz').toLowerCase().slice(0, 2);
  if (code === 'ru') return 'ru-RU';
  if (code === 'en') return 'en-US';
  return 'uz-UZ';
};

export const speechLangFallbacks = (primary) => {
  const list = [primary, 'ru-RU', 'tr-TR', 'en-US'];
  return [...new Set(list.filter(Boolean))];
};

export const cleanSpeechTranscript = (raw = '') =>
  String(raw)
    .replace(/[.!?,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * @param {{ lang?: string, enabled?: boolean }} options
 */
export default function useSpeechRecognition({ lang = 'uz-UZ', enabled = true } = {}) {
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const recognitionRef = useRef(null);
  const stoppedByUserRef = useRef(false);
  const interimRef = useRef('');
  const finalRef = useRef('');
  const activityTimerRef = useRef(0);
  const langRef = useRef(lang);
  const langIndexRef = useRef(0);
  langRef.current = lang;

  const clearVoiceActivity = useCallback(() => {
    if (activityTimerRef.current) {
      window.clearTimeout(activityTimerRef.current);
      activityTimerRef.current = 0;
    }
    setSpeaking(false);
    setVoiceLevel(0);
  }, []);

  const pulseVoiceActivity = useCallback((textLen) => {
    const intensity = Math.min(1, 0.45 + textLen * 0.06);
    setSpeaking(true);
    setVoiceLevel(intensity);
    if (activityTimerRef.current) window.clearTimeout(activityTimerRef.current);
    activityTimerRef.current = window.setTimeout(() => {
      setSpeaking(false);
      setVoiceLevel(0.28);
      activityTimerRef.current = 0;
    }, 500);
  }, []);

  const resetTranscript = useCallback(() => {
    interimRef.current = '';
    finalRef.current = '';
    setInterimText('');
    setFinalText('');
    setError(null);
    clearVoiceActivity();
  }, [clearVoiceActivity]);

  const stop = useCallback(() => {
    stoppedByUserRef.current = true;
    const rec = recognitionRef.current;
    if (!rec) {
      setListening(false);
      clearVoiceActivity();
      return;
    }
    try {
      rec.stop();
    } catch {
      setListening(false);
      clearVoiceActivity();
    }
  }, [clearVoiceActivity]);

  const abort = useCallback(() => {
    stoppedByUserRef.current = true;
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
    clearVoiceActivity();
  }, [clearVoiceActivity]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError({ error: 'not-supported' });
      return;
    }

    abort();
    stoppedByUserRef.current = false;
    langIndexRef.current = 0;
    resetTranscript();

    const langs = speechLangFallbacks(langRef.current || 'uz-UZ');

    const bindAndStart = (langCode) => {
      const recognition = new Ctor();
      recognition.lang = langCode;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let interim = '';
        let finals = '';
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result?.[0]?.transcript || '';
          if (result.isFinal) finals += `${text} `;
          else interim += text;
        }
        const finalClean = cleanSpeechTranscript(finals);
        const interimClean = cleanSpeechTranscript(interim);

        if (finalClean) {
          finalRef.current = finalClean;
          setFinalText(finalClean);
        }
        if (interimClean) {
          interimRef.current = interimClean;
          setInterimText(interimClean);
        } else if (finalClean) {
          interimRef.current = '';
          setInterimText('');
        }

        const activeLen = (finalClean || interimClean || '').length;
        if (activeLen) pulseVoiceActivity(activeLen);
      };

      recognition.onerror = (event) => {
        const code = event?.error || 'unknown';
        if (code === 'aborted') {
          setListening(false);
          return;
        }
        if (code === 'no-speech') {
          // continuous: jimlik — listeningda qolamiz, onend restart qilishi mumkin
          return;
        }
        if (
          (code === 'language-not-supported' || code === 'network') &&
          langIndexRef.current < langs.length - 1
        ) {
          langIndexRef.current += 1;
          try {
            recognition.onend = null;
            recognition.abort();
          } catch {
            /* ignore */
          }
          bindAndStart(langs[langIndexRef.current]);
          return;
        }
        setError({ error: code, message: event?.message });
        setListening(false);
        clearVoiceActivity();
      };

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;

        if (!stoppedByUserRef.current) {
          // Brauzer to‘xtatdi — qayta start (continuous sessiyani ushlab turish)
          try {
            recognition.start();
            setListening(true);
            return;
          } catch {
            /* fall through */
          }
        }

        if (!finalRef.current && interimRef.current) {
          const fallback = cleanSpeechTranscript(interimRef.current);
          finalRef.current = fallback;
          setFinalText(fallback);
          setInterimText('');
          interimRef.current = '';
        }

        recognitionRef.current = null;
        setListening(false);
        clearVoiceActivity();
      };

      try {
        recognition.start();
        setListening(true);
        setVoiceLevel(0.28);
      } catch (err) {
        if (langIndexRef.current < langs.length - 1) {
          langIndexRef.current += 1;
          bindAndStart(langs[langIndexRef.current]);
          return;
        }
        setError({ error: 'start-failed', message: err?.message || String(err) });
        setListening(false);
        recognitionRef.current = null;
      }
    };

    bindAndStart(langs[0]);
  }, [abort, resetTranscript, pulseVoiceActivity, clearVoiceActivity]);

  useEffect(() => {
    if (!enabled) {
      abort();
      resetTranscript();
    }
  }, [enabled, abort, resetTranscript]);

  useEffect(
    () => () => {
      if (activityTimerRef.current) window.clearTimeout(activityTimerRef.current);
    },
    []
  );

  const displayText = finalText || interimText;

  const getCurrentText = useCallback(
    () => cleanSpeechTranscript(finalRef.current || interimRef.current || finalText || interimText),
    [finalText, interimText]
  );

  return {
    supported: isSpeechRecognitionSupported(),
    listening,
    interimText,
    finalText,
    displayText,
    speaking,
    voiceLevel,
    error,
    start,
    stop,
    abort,
    resetTranscript,
    getCurrentText,
  };
}
