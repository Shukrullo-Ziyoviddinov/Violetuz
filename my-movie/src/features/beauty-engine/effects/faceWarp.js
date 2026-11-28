import { faceDelta, faceShapeActive } from './faceShape.js';

const COLS = 33;

const VERT = `
attribute vec2 aPos;
attribute vec2 aUv;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(uTex, vUv);
}
`;

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

export function createFaceWarp(gl) {
  const vert = compile(gl, gl.VERTEX_SHADER, VERT);
  const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.bindAttribLocation(program, 1, 'aUv');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

  const vertices = new Float32Array(COLS * COLS * 4);
  const indices = new Uint16Array((COLS - 1) * (COLS - 1) * 6);
  let offset = 0;
  for (let y = 0; y < COLS - 1; y += 1) {
    for (let x = 0; x < COLS - 1; x += 1) {
      const index = y * COLS + x;
      indices[offset++] = index;
      indices[offset++] = index + 1;
      indices[offset++] = index + COLS;
      indices[offset++] = index + 1;
      indices[offset++] = index + COLS + 1;
      indices[offset++] = index + COLS;
    }
  }

  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const fill = (face, beauty) => {
    let cursor = 0;
    for (let y = 0; y < COLS; y += 1) {
      const v = y / (COLS - 1);
      for (let x = 0; x < COLS; x += 1) {
        const u = x / (COLS - 1);
        const delta = faceDelta(u, v, face, beauty) || [0, 0];
        vertices[cursor++] = u * 2 - 1;
        vertices[cursor++] = 1 - v * 2;
        vertices[cursor++] = Math.min(1, Math.max(0, u + delta[0]));
        vertices[cursor++] = Math.min(1, Math.max(0, v + delta[1]));
      }
    }
  };

  return {
    draw(texture, face, beauty) {
      if (!faceShapeActive(beauty) || !face) return false;
      fill(face, beauty);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      return true;
    },

    destroy() {
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(program);
    },
  };
}
