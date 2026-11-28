export const skinRetouch = (beauty) => Math.min(1, Math.max(0, Number(beauty?.retouch) || 0) / 100);
export const skinTone = (beauty) => Math.min(1, Math.max(0, Number(beauty?.tone) || 0) / 100);
export const skinActive = (beauty) => skinRetouch(beauty) > 0 || skinTone(beauty) > 0;

export const skinFragment = `
precision mediump float;
uniform sampler2D uTex;
uniform sampler2D uMask;
uniform sampler2D uHair;
uniform float uRetouch;
uniform float uTone;
uniform vec2 uTexel;
varying vec2 vUv;

float protect() {
  return texture2D(uMask, vUv).r * (1.0 - texture2D(uHair, vUv).r);
}

void main() {
  vec3 center = texture2D(uTex, vUv).rgb;
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec3 sampleColor = texture2D(uTex, vUv + vec2(float(x), float(y)) * uTexel * 2.0).rgb;
      float sampleWeight = exp(-float(x * x + y * y) * 0.55);
      sum += sampleColor * sampleWeight;
      weight += sampleWeight;
    }
  }
  vec3 even = mix(center, sum / max(weight, 0.0001), uRetouch);
  float luma = dot(even, vec3(0.299, 0.587, 0.114));
  vec3 warm = vec3(luma * 1.04, luma * 0.9, luma * 0.8);
  vec3 toned = mix(even, warm, uTone * 0.42);
  gl_FragColor = vec4(mix(center, toned, protect()), 1.0);
}
`;
