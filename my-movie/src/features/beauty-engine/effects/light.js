export const lightAmount = (beauty) => Math.min(1, Math.max(0, Number(beauty?.brighten) || 0) / 100);

export const lightFragment = `
precision mediump float;
uniform sampler2D uTex;
uniform sampler2D uMask;
uniform sampler2D uHair;
uniform float uAmount;
varying vec2 vUv;

float protect() {
  return texture2D(uMask, vUv).r * (1.0 - texture2D(uHair, vUv).r);
}

void main() {
  vec3 current = texture2D(uTex, vUv).rgb;
  vec3 lifted = current + vec3(0.16, 0.14, 0.1) * uAmount;
  lifted = lifted / (vec3(1.0) + lifted * 0.18);
  gl_FragColor = vec4(mix(current, lifted, protect()), 1.0);
}
`;
