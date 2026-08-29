import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API — ovoz → matn.
 * Search algoritmiga tegmaydi; faqat transcript boshqaradi.
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
 * @param {{ lang?: string, active?: boolean }} options
 */
export default function useSpeechRecognition({ lang = 'uz-UZ', active = false } = {}) {
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const stoppedByUserRef = useRef(false);
  const langRef = useRef(lang);
  langRef.current = lang;

  const resetTranscript = useCallback(() => {
    setInterimText('');
    setFinalText('');
    setError(null);
  }, []);

  const stop = useCallback(() => {
    stoppedByUserRef.current = true;
    const rec = recognitionRef.current;
    if (!rec) {
      setListening(false);
      return;
    }
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

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
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError({ error: 'not-supported' });
      return;
    }

    abort();
    stoppedByUserRef.current = false;
    setError(null);
    setInterimText('');
    setFinalText('');

    const recognition = new Ctor();
    recognition.lang = langRef.current || 'uz-UZ';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript || '';
        if (result.isFinal) finalChunk += text;
        else interim += text;
      }
      if (finalChunk) {
        setFinalText(cleanSpeechTranscript(finalChunk));
        setInterimText('');
      } else if (interim) {
        setInterimText(cleanSpeechTranscript(interim));
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error || 'unknown';
      if (code === 'aborted' && stoppedByUserRef.current) return;
      if (code === 'no-speech') {
        setListening(false);
        return;
      }
      setError({ error: code, message: event?.message });
      setListening(false);
    };

    recognition.onend = () => {
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
  }, [abort]);

  useEffect(() => {
    if (!active) {
      abort();
      return undefined;
    }
    start();
    return () => {
      abort();
    };
  }, [active, start, abort]);

  const displayText = finalText || interimText;

  return {
    supported: isSpeechRecognitionSupported(),
    listening,
    interimText,
    finalText,
    displayText,
    error,
    start,
    stop,
    abort,
    resetTranscript,
  };
}
