export const contourAmount = (beauty) => Math.min(1, Math.max(0, Number(beauty?.contour) || 0) / 100);

export const contourFragment = `
precision mediump float;
uniform sampler2D uTex;
uniform sampler2D uMask;
uniform sampler2D uHair;
uniform float uAmount;
uniform vec2 uNose;
varying vec2 vUv;

float protect() {
  return texture2D(uMask, vUv).r * (1.0 - texture2D(uHair, vUv).r);
}

void main() {
  vec3 current = texture2D(uTex, vUv).rgb;
  float dist = distance(vUv, uNose);
  float side = smoothstep(0.025, 0.2, dist);
  vec3 shaded = current * mix(1.07, 0.8, side);
  gl_FragColor = vec4(mix(current, shaded, protect() * uAmount), 1.0);
}
`;
