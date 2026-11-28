const urls = [
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite',
  'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf',
  'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Multiclass%20Segmentation.pdf',
  'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Selfie%20Segmentation.pdf',
];

for (const url of urls) {
  const response = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
  const range = response.headers.get('content-range') || response.headers.get('content-length') || '';
  const type = response.headers.get('content-type') || '';
  console.log(`${response.status} ${type} ${range} ${url}`);
}
