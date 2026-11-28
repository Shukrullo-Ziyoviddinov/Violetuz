import { BEAUTY_MODELS, BEAUTY_WASM_PATH } from '../config/localAssets.js';

export async function loadFaceLandmarker() {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(BEAUTY_WASM_PATH);
  const base = {
    modelAssetPath: BEAUTY_MODELS.faceLandmarker,
  };
  try {
    return await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { ...base, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
    });
  } catch {
    return vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { ...base, delegate: 'CPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
    });
  }
}
