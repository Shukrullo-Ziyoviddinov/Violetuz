import { useCallback, useEffect, useRef, useState } from 'react';
import { createBeautyEngine } from '../core/createBeautyEngine.js';
import { holdBeautyEngine } from './holdBeautyEngine.js';

export function useBeautyEngine({ inputStream = null, inputVideo = null } = {}) {
  const engineRef = useRef(null);
  const engine = holdBeautyEngine(engineRef, createBeautyEngine);

  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(() => engine.getSettings());
  const [processedStream, setProcessedStream] = useState(null);

  useEffect(() => {
    let alive = true;
    const unsubscribe = engine.subscribe(() => {
      if (!alive) return;
      setSettings(engine.getSettings());
      setProcessedStream(engine.getProcessedStream());
    });
    engine.initialize().then(() => {
      if (!alive) return;
      setReady(true);
      setSettings(engine.getSettings());
      setProcessedStream(engine.getProcessedStream());
    });
    return () => {
      alive = false;
      unsubscribe();
      engine.destroy();
    };
  }, [engine]);

  useEffect(() => {
    engine.setInputStream(inputStream);
  }, [engine, inputStream]);

  useEffect(() => {
    engine.setInputVideo(inputVideo);
  }, [engine, inputVideo]);

  const setBeauty = useCallback((partial) => engine.setBeauty(partial), [engine]);
  const setAdjust = useCallback((partial) => engine.setAdjust(partial), [engine]);
  const setFilter = useCallback((filterId) => engine.setFilter(filterId), [engine]);
  const setBackground = useCallback((background) => engine.setBackground(background), [engine]);
  const setPreset = useCallback((presetId) => engine.setPreset(presetId), [engine]);
  const setEnabled = useCallback((enabled) => engine.setEnabled(enabled), [engine]);
  const setQuality = useCallback((quality) => engine.setQuality(quality), [engine]);
  const reset = useCallback(() => engine.reset(), [engine]);

  return {
    engine,
    ready,
    settings,
    processedStream,
    processedVideoTrack: processedStream?.getVideoTracks?.()[0] || null,
    setInputStream: engine.setInputStream,
    setInputVideo: engine.setInputVideo,
    setBeauty,
    setAdjust,
    setFilter,
    setBackground,
    setPreset,
    setEnabled,
    setQuality,
    reset,
  };
}
