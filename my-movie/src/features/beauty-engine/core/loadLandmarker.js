import { BEAUTY_MODELS, BEAUTY_WASM_PATH } from '../config/localAssets.js';

const faceOptions = (delegate) => ({
  baseOptions: {
    modelAssetPath: BEAUTY_MODELS.faceLandmarker,
    delegate,
  },
  runningMode: 'VIDEO',
  numFaces: 1,
  minFaceDetectionConfidence: 0.35,
  minFacePresenceConfidence: 0.35,
  minTrackingConfidence: 0.35,
});

export async function loadFaceLandmarker(delegate = 'GPU') {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(BEAUTY_WASM_PATH);
  if (delegate === 'CPU') {
    return vision.FaceLandmarker.createFromOptions(fileset, faceOptions('CPU'));
  }
  try {
    return await vision.FaceLandmarker.createFromOptions(fileset, faceOptions('GPU'));
  } catch {
    return vision.FaceLandmarker.createFromOptions(fileset, faceOptions('CPU'));
  }
}
