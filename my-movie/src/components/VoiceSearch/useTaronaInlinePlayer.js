import { useCallback, useRef, useState } from 'react';
import { fetchMusicById } from '../../api/musicApi';

const getAudioSrc = (item) => {
  const raw = item?.audio;
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (typeof window !== 'undefined' && raw.startsWith('/')) {
    return `${window.location.origin}${raw}`;
  }
  return raw;
};

const useTaronaInlinePlayer = () => {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceRef.current) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setPlayingId(null);
    setIsPlaying(false);
  }, []);

  const resolveAudio = useCallback(async (item) => {
    let src = getAudioSrc(item);
    if (!src && item?.id) {
      try {
        const full = await fetchMusicById(item.id);
        src = getAudioSrc(full);
      } catch {
        src = '';
      }
    }
    return src;
  }, []);

  const toggleTrack = useCallback(
    async (item) => {
      if (!item?.id) return;

      const audio = audioRef.current;
      if (!audio) return;

      if (playingId === item.id) {
        if (isPlaying) {
          audio.pause();
        } else {
          ensureGraph();
          if (audioCtxRef.current?.state === 'suspended') {
            await audioCtxRef.current.resume().catch(() => {});
          }
          try {
            await audio.play();
          } catch {
            setIsPlaying(false);
          }
        }
        return;
      }

      const src = await resolveAudio(item);
      if (!src) return;

      ensureGraph();
      if (audioCtxRef.current?.state === 'suspended') {
        await audioCtxRef.current.resume().catch(() => {});
      }

      setPlayingId(item.id);
      audio.pause();
      audio.src = src;
      audio.load();

      try {
        await audio.play();
      } catch {
        setPlayingId(null);
        setIsPlaying(false);
      }
    },
    [ensureGraph, isPlaying, playingId, resolveAudio]
  );

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleEnded = useCallback(() => {
    setPlayingId(null);
    setIsPlaying(false);
  }, []);

  return {
    audioRef,
    analyserRef,
    playingId,
    isPlaying,
    toggleTrack,
    stop,
    handlePlay,
    handlePause,
    handleEnded,
  };
};

export default useTaronaInlinePlayer;
