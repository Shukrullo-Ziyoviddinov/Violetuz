import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API — ovoz → matn.
 * Bitta sessiya (restart yo‘q) — takrorlanish bo‘lmasin.
 */

export const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => Boolean(getSpeechRecognitionCtor());

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
 * Brauzer natijasidan to‘liq matn (takrorlanmas).
 * Oxirgi interim odatda butun gapni o‘z ichiga oladi.
 */
export const extractTranscript = (results) => {
  if (!results?.length) return '';

  const last = results[results.length - 1];
  if (!last.isFinal) {
    return cleanSpeechTranscript(last[0]?.transcript || '');
  }

  let combined = '';
  for (let i = 0; i < results.length; i += 1) {
    if (results[i].isFinal) {
      combined += results[i][0]?.transcript || '';
    }
  }
  return cleanSpeechTranscript(combined);
};

export default function useSpeechRecognition({ lang = 'uz-UZ', enabled = true } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const recognitionRef = useRef(null);
  const stoppedByUserRef = useRef(false);
  const transcriptRef = useRef('');
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
    transcriptRef.current = '';
    setTranscript('');
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
    resetTranscript();

    const recognition = new Ctor();
    recognition.lang = langRef.current || 'uz-UZ';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const text = extractTranscript(event.results);
      if (!text) return;
      transcriptRef.current = text;
      setTranscript(text);
      pulseVoiceActivity(text.length);
    };

    recognition.onerror = (event) => {
      const code = event?.error || 'unknown';
      if (code === 'aborted' || code === 'no-speech') {
        setListening(false);
        return;
      }
      setError({ error: code, message: event?.message });
      setListening(false);
      clearVoiceActivity();
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setListening(false);
      clearVoiceActivity();
    };

    try {
      recognition.start();
      setListening(true);
      setVoiceLevel(0.28);
    } catch (err) {
      setError({ error: 'start-failed', message: err?.message || String(err) });
      setListening(false);
      recognitionRef.current = null;
    }
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

  const getCurrentText = useCallback(() => transcriptRef.current || transcript, [transcript]);

  return {
    supported: isSpeechRecognitionSupported(),
    listening,
    transcript,
    displayText: transcript,
    finalText: transcript,
    interimText: '',
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
