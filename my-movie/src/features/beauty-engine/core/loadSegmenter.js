import { BEAUTY_MODELS, BEAUTY_WASM_PATH } from '../config/localAssets.js';

async function loadSegmenter(modelPath, options) {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(BEAUTY_WASM_PATH);
  try {
    return await vision.ImageSegmenter.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
    });
  } catch {
    return vision.ImageSegmenter.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' },
    });
  }
}

export function loadPersonSegmenter() {
  return loadSegmenter(BEAUTY_MODELS.selfieSegmenter, {
    runningMode: 'VIDEO',
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });
}

export function loadHairSegmenter() {
  return loadSegmenter(BEAUTY_MODELS.selfieMulticlass, {
    runningMode: 'VIDEO',
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });
}
