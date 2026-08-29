import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API — ovoz → matn.
 * Search algoritmiga tegmaydi; faqat transcript boshqaradi.
 * start() faqat mikrafon bosilganda chaqiriladi (auto-start yo‘q).
 */

export const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => Boolean(getSpeechRecognitionCtor());

/** App tili → BCP-47 */
export const resolveSpeechLang = (appLang = 'uz') => {
  const code = String(appLang || 'uz').toLowerCase().slice(0, 2);
  if (code === 'ru') return 'ru-RU';
  if (code === 'en') return 'en-US';
  return 'uz-UZ';
};

export const cleanSpeechTranscript = (raw = '') =>
  String(raw)
    .replace(/[.!?,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Voice search STT tizimi (alohida).
 * @param {{ lang?: string, enabled?: boolean }} options
 */
export default function useSpeechRecognition({ lang = 'uz-UZ', enabled = true } = {}) {
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState(null);
  /** Visual: ovoz aniqlanganda (interim/final) — getUserMedia yo‘q */
  const [speaking, setSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const recognitionRef = useRef(null);
  const stoppedByUserRef = useRef(false);
  const interimRef = useRef('');
  const finalRef = useRef('');
  const activityTimerRef = useRef(0);
  const langRef = useRef(lang);
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
    const intensity = Math.min(1, 0.4 + textLen * 0.05);
    setSpeaking(true);
    setVoiceLevel(intensity);
    if (activityTimerRef.current) window.clearTimeout(activityTimerRef.current);
    activityTimerRef.current = window.setTimeout(() => {
      setSpeaking(false);
      setVoiceLevel(0);
      activityTimerRef.current = 0;
    }, 420);
  }, []);

  const resetTranscript = useCallback(() => {
    interimRef.current = '';
    finalRef.current = '';
    setInterimText('');
    setFinalText('');
    setError(null);
    clearVoiceActivity();
  }, [clearVoiceActivity]);

  /** stop — final natija kelishi uchun listening ni onend da o‘chiramiz */
  const stop = useCallback(() => {
    stoppedByUserRef.current = true;
    clearVoiceActivity();
    const rec = recognitionRef.current;
    if (!rec) {
      setListening(false);
      return;
    }
    try {
      rec.stop();
    } catch {
      setListening(false);
    }
  }, [clearVoiceActivity]);

  const abort = useCallback(() => {
    stoppedByUserRef.current = true;
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try {
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
    resetTranscript();

    const recognition = new Ctor();
    recognition.lang = langRef.current || 'uz-UZ';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = '';
      let finals = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript || '';
        if (result.isFinal) finals += text;
        else interim += text;
      }
      if (finals) {
        const cleaned = cleanSpeechTranscript(finals);
        finalRef.current = cleaned;
        interimRef.current = '';
        setFinalText(cleaned);
        setInterimText('');
        pulseVoiceActivity(cleaned.length);
      } else if (interim) {
        const cleaned = cleanSpeechTranscript(interim);
        interimRef.current = cleaned;
        setInterimText(cleaned);
        pulseVoiceActivity(cleaned.length);
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error || 'unknown';
      clearVoiceActivity();
      if (code === 'aborted') {
        setListening(false);
        return;
      }
      if (code === 'no-speech') {
        setListening(false);
        return;
      }
      setError({ error: code, message: event?.message });
      setListening(false);
    };

    recognition.onend = () => {
      clearVoiceActivity();
      if (!finalRef.current && interimRef.current) {
        const fallback = cleanSpeechTranscript(interimRef.current);
        finalRef.current = fallback;
        setFinalText(fallback);
        setInterimText('');
        interimRef.current = '';
      }
      setListening(false);
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      setError({ error: 'start-failed', message: err?.message || String(err) });
      setListening(false);
      recognitionRef.current = null;
    }
  }, [abort, resetTranscript, pulseVoiceActivity, clearVoiceActivity]);

  /** Modal yopilganda: abort + matnni tozalash (keyingi ochilishda eski natija qolmasin) */
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
