const PERSON_CLASS = 1;

export function backgroundActive(background) {
  return Boolean(background?.mode && background.mode !== 'original');
}

export function hexToRgb(hex) {
  if (typeof hex !== 'string') return [0, 0, 0];
  let body = hex.trim().slice(1);
  if (body.length === 3) body = body.split('').map((part) => part + part).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(body)) return [0, 0, 0];
  const value = Number.parseInt(body, 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export function personBuffer(categoryMask) {
  if (!categoryMask || typeof categoryMask.getAsUint8Array !== 'function') return null;
  const source = categoryMask.getAsUint8Array();
  if (!source?.length || !categoryMask.width || !categoryMask.height) return null;
  const data = new Uint8Array(source.length);
  let found = false;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== PERSON_CLASS) continue;
    data[index] = 255;
    found = true;
  }
  if (!found) return null;
  return { data, width: categoryMask.width, height: categoryMask.height };
}

export const blurFragment = `
precision mediump float;
uniform sampler2D uTex;
uniform float uAmount;
uniform vec2 uTexel;
varying vec2 vUv;

void main() {
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  float radius = max(uAmount, 0.0) * 10.0;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 offset = vec2(float(x), float(y)) * uTexel * radius;
      float sampleWeight = exp(-float(x * x + y * y) * 0.35);
      sum += texture2D(uTex, vUv + offset).rgb * sampleWeight;
      weight += sampleWeight;
    }
  }
  gl_FragColor = vec4(sum / max(weight, 0.0001), 1.0);
}
`;

export const backgroundFragment = `
precision mediump float;
uniform sampler2D uPerson;
uniform sampler2D uPlate;
uniform sampler2D uMask;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec2 uFrame;
uniform vec2 uMedia;
uniform float uKind;
varying vec2 vUv;

vec2 coverUv(vec2 uv) {
  if (uMedia.x < 1.0 || uMedia.y < 1.0 || uFrame.y < 1.0) return uv;
  float frameAspect = uFrame.x / uFrame.y;
  float mediaAspect = uMedia.x / uMedia.y;
  vec2 scale = frameAspect > mediaAspect
    ? vec2(mediaAspect / frameAspect, 1.0)
    : vec2(1.0, frameAspect / mediaAspect);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  float person = smoothstep(0.3, 0.7, texture2D(uMask, vUv).r);
  vec3 foreground = texture2D(uPerson, vUv).rgb;
  vec3 plate = uKind < 0.5
    ? uColorA
    : (uKind < 1.5 ? mix(uColorA, uColorB, vUv.y) : texture2D(uPlate, coverUv(vUv)).rgb);
  gl_FragColor = vec4(mix(plate, foreground, person), 1.0);
}
`;
