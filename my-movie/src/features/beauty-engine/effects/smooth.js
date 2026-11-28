export const smoothAmount = (beauty) => Math.min(1, Math.max(0, Number(beauty?.smooth) || 0) / 100);

export const smoothFragment = `
precision mediump float;
uniform sampler2D uTex;
uniform sampler2D uSource;
uniform sampler2D uMask;
uniform sampler2D uHair;
uniform float uAmount;
uniform vec2 uTexel;
varying vec2 vUv;

float protect() {
  return texture2D(uMask, vUv).r * (1.0 - texture2D(uHair, vUv).r);
}

void main() {
  vec3 center = texture2D(uSource, vUv).rgb;
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  float radius = 1.0 + uAmount * 16.0;
  for (int y = -3; y <= 3; y++) {
    for (int x = -3; x <= 3; x++) {
      vec2 offset = vec2(float(x), float(y)) * uTexel * radius;
      vec3 sampleColor = texture2D(uSource, vUv + offset).rgb;
      float spatial = exp(-float(x * x + y * y) * 0.22);
      vec3 delta = sampleColor - center;
      float range = exp(-dot(delta, delta) * 6.0);
      float sampleWeight = spatial * range;
      sum += sampleColor * sampleWeight;
      weight += sampleWeight;
    }
  }
  vec3 smoothed = sum / max(weight, 0.0001);
  vec3 current = texture2D(uTex, vUv).rgb;
  gl_FragColor = vec4(mix(current, smoothed, protect() * uAmount), 1.0);
}
`;
