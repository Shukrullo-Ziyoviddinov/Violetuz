import { isSpeechRecognitionSupported } from './useSpeechRecognition';

export { isSpeechRecognitionSupported };

export const isMediaRecorderSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.MediaRecorder && navigator?.mediaDevices?.getUserMedia);
};

/** Mikrofon modalini ko'rsatish (Ovoz yoki Tarona) */
export const isVoiceSearchAvailable = () =>
  isSpeechRecognitionSupported() || isMediaRecorderSupported();

export const isTaronaIdentifySupported = () => isMediaRecorderSupported();
