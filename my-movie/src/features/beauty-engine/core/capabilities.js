export function beautySupport() {
  if (typeof document === 'undefined' || typeof WebAssembly === 'undefined') {
    return { ok: false, reason: 'environment' };
  }
  const canvas = document.createElement('canvas');
  if (typeof canvas.captureStream !== 'function') {
    return { ok: false, reason: 'capture' };
  }
  const gl = canvas.getContext('webgl2');
  if (!gl) return { ok: false, reason: 'webgl' };
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return { ok: true };
}
