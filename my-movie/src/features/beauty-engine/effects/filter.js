export const filterFragment = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uExposure;
uniform float uTemperature;
uniform float uTint;
uniform float uHighlights;
uniform float uShadows;
uniform float uGamma;
uniform float uVibrance;
uniform float uSharpness;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(uTex, vUv).rgb;
  vec3 detail = vec3(0.0);
  if (uSharpness > 0.001) {
    vec3 around = (
      texture2D(uTex, vUv + vec2(uTexel.x, 0.0)).rgb +
      texture2D(uTex, vUv - vec2(uTexel.x, 0.0)).rgb +
      texture2D(uTex, vUv + vec2(0.0, uTexel.y)).rgb +
      texture2D(uTex, vUv - vec2(0.0, uTexel.y)).rgb
    ) * 0.25;
    detail = color - around;
  }
  color *= pow(2.0, uExposure * 1.25);
  color += uBrightness * 0.35;
  color = (color - 0.5) * (1.0 + uContrast * 0.85) + 0.5;

  float luma = dot(max(color, 0.0), vec3(0.2126, 0.7152, 0.0722));
  float high = smoothstep(0.5, 1.0, luma);
  float low = 1.0 - smoothstep(0.0, 0.5, luma);
  color += uHighlights * high * 0.4;
  color += uShadows * low * 0.4;

  color.r += uTemperature * 0.16 + uTint * 0.06;
  color.g -= uTint * 0.12;
  color.b += uTint * 0.06 - uTemperature * 0.16;

  luma = dot(max(color, 0.0), vec3(0.2126, 0.7152, 0.0722));
  float peak = max(color.r, max(color.g, color.b));
  float valley = min(color.r, min(color.g, color.b));
  float spread = clamp(peak - valley, 0.0, 1.0);
  color = mix(vec3(luma), color, 1.0 + uVibrance * (1.0 - spread));
  luma = dot(max(color, 0.0), vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, 1.0 + uSaturation);

  float exponent = 1.0 / max(0.25, 1.0 + uGamma * 0.75);
  color = pow(max(color, 0.0), vec3(exponent));
  color += detail * uSharpness * 1.4;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
