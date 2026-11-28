import React, { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { BEAUTY_STORAGE_KEY } from '../config/beautyConfig';
import { createBeautyEngine } from './createBeautyEngine';
import { useBeautyEngine } from '../hooks/useBeautyEngine';

const media = () => {
  const video = { readyState: 'live', stop: jest.fn() };
  const audio = { readyState: 'live', stop: jest.fn() };
  return {
    video,
    audio,
    stream: {
      getVideoTracks: () => [video],
      getAudioTracks: () => [audio],
    },
  };
};

let previousSettings;
let previousMedia;

beforeEach(() => {
  previousSettings = localStorage.getItem(BEAUTY_STORAGE_KEY);
  localStorage.removeItem(BEAUTY_STORAGE_KEY);
  previousMedia = navigator.mediaDevices;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn() },
  });
});

afterEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: previousMedia,
  });
  if (previousSettings == null) localStorage.removeItem(BEAUTY_STORAGE_KEY);
  else localStorage.setItem(BEAUTY_STORAGE_KEY, previousSettings);
});

test('returns the caller stream and does not stop the microphone', async () => {
  const { video, audio, stream } = media();
  const engine = createBeautyEngine();
  await act(async () => {
    await engine.initialize();
  });
  engine.setInputStream(stream);
  expect(engine.getProcessedStream()).toBe(stream);
  engine.setFilter('natural');
  engine.setBeauty({ smooth: 30 });
  engine.setAdjust({ temperature: 12 });
  engine.setBackground({ mode: 'blur', amount: 25 });
  expect(engine.getProcessedStream()).toBe(stream);
  expect(engine.getSettings().beauty.slim).toBe(0);
  expect(engine.getSettings().adjust.temperature).toBe(12);
  engine.destroy();
  engine.destroy();
  expect(engine.getProcessedStream()).toBeNull();
  expect(video.stop).not.toHaveBeenCalled();
  expect(audio.stop).not.toHaveBeenCalled();
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
});

test('keeps one engine across renders and closes it on unmount', async () => {
  const { video, audio, stream } = media();
  const seen = [];
  const Harness = ({ inputStream }) => {
    const api = useBeautyEngine({ inputStream });
    useEffect(() => {
      seen.push(api.engine);
    });
    return <span>{api.settings.filter}</span>;
  };
  const view = render(<Harness inputStream={stream} />);
  await waitFor(() => expect(seen.length).toBeGreaterThan(0));
  view.rerender(<Harness inputStream={stream} />);
  expect(seen[0]).toBe(seen[seen.length - 1]);
  expect(new Set(seen).size).toBe(1);
  view.unmount();
  expect(seen[0].getProcessedStream()).toBeNull();
  expect(video.stop).not.toHaveBeenCalled();
  expect(audio.stop).not.toHaveBeenCalled();
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
});
