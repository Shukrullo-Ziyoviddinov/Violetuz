import {
  applyPresetSettings,
  beautyAdjustments,
  beautyEffects,
  createDefaultSettings,
  isFilterId,
  isQuality,
  patchUnits,
  readBeautySettings,
  gradeActive,
  resolveGrade,
  sanitizeBackground,
  writeBeautySettings,
} from '../config/beautyConfig.js';
import { backgroundActive, personBuffer } from '../effects/background.js';
import { followFace } from '../effects/faceShape.js';
import { effectsActive, frameNeedsModel, createEffectPipeline, hairBuffer } from '../effects/pipeline.js';
import { beautySupport } from './capabilities.js';
import { closeVisionTask } from './closeVisionTask.js';
import { createFrameOutput } from './frameOutput.js';
import { revokeTemporaryUrls } from './temporaryUrls.js';
import { loadFaceLandmarker } from './loadLandmarker.js';
import { loadHairSegmenter, loadPersonSegmenter } from './loadSegmenter.js';

const cloneSettings = (settings) => ({
  enabled: settings.enabled,
  quality: settings.quality,
  preset: settings.preset,
  filter: settings.filter,
  background: { ...settings.background },
  beauty: { ...settings.beauty },
  adjust: { ...settings.adjust },
});

export function createBeautyEngine() {
  let inputStream = null;
  let inputVideo = null;
  let playback = null;
  let output = null;
  let effects = null;
  let landmarker = null;
  let segmenter = null;
  let segmenterPromise = null;
  let segmenterFailed = false;
  let segmenterToken = 0;
  let personSegmenter = null;
  let personPromise = null;
  let personFailed = false;
  let personToken = 0;
  let faceStamp = 0;
  let hairStamp = 0;
  let personStamp = 0;
  let stableFace = null;
  let faceCount = 0;
  let faceCpu = false;
  let faceMisses = 0;
  let mode = 'passthrough';
  let destroyed = false;
  let initToken = 0;
  let loopHandle = 0;
  let loopKind = '';
  let settings = readBeautySettings() || createDefaultSettings();
  const listeners = new Set();

  const notify = () => {
    const snapshot = cloneSettings(settings);
    listeners.forEach((listener) => listener(snapshot));
  };

  const commit = (next) => {
    if (JSON.stringify(next) === JSON.stringify(settings)) return;
    settings = next;
    writeBeautySettings(settings);
    notify();
  };

  const live = () => !destroyed;

  const sourceVideo = () => inputVideo || playback;

  const stopLoop = () => {
    const video = sourceVideo();
    if (loopKind === 'video' && video?.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(loopHandle);
    }
    if (loopKind === 'frame') cancelAnimationFrame(loopHandle);
    loopHandle = 0;
    loopKind = '';
  };

  const dropOutput = () => {
    stopLoop();
    effects?.destroy();
    effects = null;
    output?.destroy();
    output = null;
    mode = 'passthrough';
  };

  const releasePlayback = () => {
    if (!playback) return;
    playback.pause();
    playback.srcObject = null;
    playback.remove?.();
    playback = null;
  };

  const switchFaceToCpu = () => {
    if (faceCpu) return;
    faceCpu = true;
    faceMisses = 0;
    faceStamp = 0;
    const token = initToken;
    const dying = landmarker;
    landmarker = null;
    closeVisionTask(dying);
    loadFaceLandmarker('CPU').then((model) => {
      if (!live() || token !== initToken) {
        closeVisionTask(model);
        return;
      }
      landmarker = model;
    }).catch(() => {});
  };

  const closeModel = () => {
    closeVisionTask(landmarker);
    landmarker = null;
    segmenterToken += 1;
    closeVisionTask(segmenter);
    segmenter = null;
    segmenterPromise = null;
    segmenterFailed = false;
    personToken += 1;
    closeVisionTask(personSegmenter);
    personSegmenter = null;
    personPromise = null;
    personFailed = false;
  };

  const bumpStamp = (current) => {
    const now = Math.round(performance.now());
    return now > current ? now : current + 1;
  };

  const ensureSegmenter = () => {
    if (segmenter || segmenterPromise || segmenterFailed) return;
    const token = segmenterToken;
    segmenterPromise = loadHairSegmenter().then((model) => {
      if (!live() || token !== segmenterToken) {
        closeVisionTask(model);
        return;
      }
      segmenter = model;
    }).catch(() => {
      if (!live() || token !== segmenterToken) return;
      segmenterFailed = true;
      segmenterPromise = null;
    });
  };

  const ensurePerson = () => {
    if (personSegmenter || personPromise || personFailed) return;
    const token = personToken;
    personPromise = loadPersonSegmenter().then((model) => {
      if (!live() || token !== personToken) {
        closeVisionTask(model);
        return;
      }
      personSegmenter = model;
    }).catch(() => {
      if (!live() || token !== personToken) return;
      personFailed = true;
      personPromise = null;
    });
  };

  const ensurePlayback = () => {
    if (inputVideo) return inputVideo;
    if (!inputStream || typeof document === 'undefined') return null;
    if (!playback) {
      playback = document.createElement('video');
      playback.muted = true;
      playback.defaultMuted = true;
      playback.playsInline = true;
      playback.autoplay = true;
      playback.setAttribute('playsinline', '');
      playback.setAttribute('muted', '');
      playback.setAttribute('aria-hidden', 'true');
      playback.style.cssText = 'position:fixed;left:0;top:0;width:8px;height:8px;opacity:0.02;pointer-events:none';
    }
    if (!playback.isConnected && document.body) document.body.appendChild(playback);
    if (playback.srcObject !== inputStream) playback.srcObject = inputStream;
    try {
      const pending = playback.play?.();
      pending?.catch?.(() => {
        if (!live()) return;
        playback?.play?.().catch?.(() => {});
      });
    } catch {
      // avtoijro rad etilsa ham qayta ishlash kanvasi saqlanadi
    }
    return playback;
  };

  const tick = () => {
    loopHandle = 0;
    loopKind = '';
    if (!live() || mode !== 'webgl' || !output) return;
    const video = sourceVideo();
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      schedule();
      return;
    }
    if (output.resize(video.videoWidth, video.videoHeight, settings.quality)) {
      const beauty = settings.enabled ? settings.beauty : null;
      const background = settings.enabled ? settings.background : null;
      const grade = settings.enabled ? resolveGrade(settings.filter, settings.adjust) : null;
      const needsFace = frameNeedsModel(beauty);
      const needsBackground = backgroundActive(background);
      const needsGrade = gradeActive(grade);
      if (effects && (needsFace || needsBackground || needsGrade)) {
        if (effectsActive(beauty)) ensureSegmenter();
        if (needsBackground) ensurePerson();
        let landmarks = null;
        if (needsFace && landmarker) {
          try {
            faceStamp = bumpStamp(faceStamp);
            landmarks = landmarker.detectForVideo(video, faceStamp)?.faceLandmarks?.[0] || null;
            faceCount = landmarks?.length || 0;
            if (faceCount) faceMisses = 0;
            else {
              faceMisses += 1;
              if (!faceCpu && faceMisses >= 12) switchFaceToCpu();
            }
          } catch {
            faceCount = 0;
            landmarks = null;
            switchFaceToCpu();
          }
        } else {
          faceCount = 0;
        }
        stableFace = needsFace ? followFace(stableFace, landmarks) : null;
        let hair = null;
        if (effectsActive(beauty) && segmenter) {
          try {
            hairStamp = bumpStamp(hairStamp);
            const result = segmenter.segmentForVideo(video, hairStamp);
            hair = hairBuffer(result?.categoryMask);
            result?.categoryMask?.close?.();
          } catch {
            hair = null;
            segmenterFailed = true;
            closeVisionTask(segmenter);
            segmenter = null;
            segmenterPromise = null;
          }
        }
        let person = null;
        if (needsBackground && personSegmenter) {
          try {
            personStamp = bumpStamp(personStamp);
            const result = personSegmenter.segmentForVideo(video, personStamp);
            person = personBuffer(result?.categoryMask);
            result?.categoryMask?.close?.();
          } catch {
            person = null;
            personFailed = true;
            closeVisionTask(personSegmenter);
            personSegmenter = null;
            personPromise = null;
          }
        }
        try {
          const size = output.size();
          effects.resize(size.width, size.height);
          const started = performance.now();
          if (effects.draw(video, beauty, stableFace, hair, { background, person, grade })) output.noteFrame(started);
          else output.draw(video);
        } catch {
          stableFace = null;
          try {
            output.draw(video);
          } catch {
            // bitta yomon kadr yozuvni to‘xtatmaydi
          }
        }
      } else {
        stableFace = null;
        output.draw(video);
      }
    }
    schedule();
  };

  const schedule = () => {
    if (!live() || mode !== 'webgl' || loopHandle) return;
    loopKind = 'frame';
    loopHandle = requestAnimationFrame(() => tick());
  };

  const arm = () => {
    if (!landmarker || (!inputStream && !inputVideo)) return;
    if (!output) {
      output = createFrameOutput();
      mode = output ? 'webgl' : 'passthrough';
      if (!output) return;
      try {
        effects = createEffectPipeline(output.gl());
      } catch {
        effects = null;
      }
    }
    ensurePlayback();
    output.stream();
    schedule();
  };

  const processed = () => {
    if (!live()) return null;
    if (!inputStream && !inputVideo) return null;
    if (mode === 'webgl' && output) {
      const stream = output.stream();
      if (stream?.getVideoTracks?.()[0]) return stream;
    }
    return inputVideo?.srcObject || inputStream;
  };

  const api = {
    initialize() {
      const token = ++initToken;
      destroyed = false;
      faceCpu = false;
      faceMisses = 0;
      faceCount = 0;
      faceStamp = 0;
      const saved = readBeautySettings();
      if (saved) settings = saved;
      dropOutput();
      closeModel();
      if (!beautySupport().ok) {
        mode = 'passthrough';
        notify();
        return Promise.resolve(api);
      }
      return loadFaceLandmarker().then((model) => {
        if (token !== initToken || destroyed) {
          closeVisionTask(model);
          return api;
        }
        landmarker = model;
        if (inputStream || inputVideo) {
          arm();
          if (!output) closeModel();
        }
        notify();
        return api;
      }).catch(() => {
        if (token !== initToken || destroyed) return api;
        dropOutput();
        closeModel();
        notify();
        return api;
      });
    },

    setInputStream(stream) {
      if (!live()) return api;
      stopLoop();
      inputStream = stream || null;
      arm();
      notify();
      return api;
    },

    setInputVideo(video) {
      if (!live()) return api;
      stopLoop();
      inputVideo = video || null;
      if (inputVideo) releasePlayback();
      arm();
      notify();
      return api;
    },

    setBeauty(partial) {
      if (!live()) return api;
      const beauty = patchUnits(settings.beauty, partial, beautyEffects);
      if (!beauty) return api;
      commit({ ...settings, beauty });
      return api;
    },

    setAdjust(partial) {
      if (!live()) return api;
      const adjust = patchUnits(settings.adjust, partial, beautyAdjustments);
      if (!adjust) return api;
      commit({ ...settings, adjust });
      return api;
    },

    setFilter(filterId) {
      if (!live() || !isFilterId(filterId)) return api;
      commit({ ...settings, filter: filterId });
      return api;
    },

    setBackground(background) {
      if (!live()) return api;
      const next = sanitizeBackground(background);
      if (!next) return api;
      commit({ ...settings, background: next });
      return api;
    },

    setPreset(presetId) {
      if (!live()) return api;
      const next = applyPresetSettings(settings, presetId);
      if (!next) return api;
      commit(next);
      return api;
    },

    setEnabled(enabled) {
      if (!live() || typeof enabled !== 'boolean') return api;
      commit({ ...settings, enabled });
      return api;
    },

    setQuality(quality) {
      if (!live() || !isQuality(quality)) return api;
      commit({ ...settings, quality });
      return api;
    },

    getSettings() {
      return cloneSettings(settings);
    },

    getProcessedStream() {
      return processed();
    },

    getProcessedVideoTrack() {
      return processed()?.getVideoTracks?.()[0] || null;
    },

    getOutputCanvas() {
      return output?.canvas || null;
    },

    getPerformanceStats() {
      const frame = output?.stats?.() || { fps: 0, frameMs: 0 };
      return {
        mode,
        fps: frame.fps,
        frameMs: frame.frameMs,
        hasVideo: Boolean(sourceVideo()),
        model: Boolean(landmarker),
        faces: faceCount,
      };
    },

    reset() {
      if (!live()) return api;
      commit(createDefaultSettings());
      return api;
    },

    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    destroy() {
      initToken += 1;
      destroyed = true;
      dropOutput();
      closeModel();
      releasePlayback();
      stableFace = null;
      inputStream = null;
      inputVideo = null;
      listeners.clear();
      revokeTemporaryUrls();
    },
  };

  return api;
}
