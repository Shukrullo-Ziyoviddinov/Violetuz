const EDGE = { low: 640, medium: 1280, high: 1920, auto: 1280 };

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

const even = (value) => Math.max(2, Math.round(value / 2) * 2);

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

export function createFrameOutput() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!gl || typeof canvas.captureStream !== 'function') return null;

  const vert = compile(gl, gl.VERTEX_SHADER, VERT);
  const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = vert && frag ? gl.createProgram() : null;
  if (!program) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.bindAttribLocation(program, 1, 'aUv');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    1, 1, 1, 0,
  ]), gl.STATIC_DRAW);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let stream = null;
  let width = 0;
  let height = 0;
  let frames = 0;
  let fps = 0;
  let windowStarted = 0;
  let frameMs = 0;

  const noteFrame = (started) => {
    frames += 1;
    frameMs = performance.now() - started;
    const now = started;
    if (!windowStarted) windowStarted = now;
    if (now - windowStarted >= 1000) {
      fps = frames;
      frames = 0;
      windowStarted = now;
    }
  };

  return {
    canvas,

    gl() {
      return gl;
    },

    size() {
      return { width, height };
    },

    noteFrame,

    resize(sourceWidth, sourceHeight, quality) {
      const edge = EDGE[quality] || EDGE.auto;
      const long = Math.max(sourceWidth, sourceHeight);
      if (!long) return false;
      const scale = long > edge ? edge / long : 1;
      const nextWidth = even(sourceWidth * scale);
      const nextHeight = even(sourceHeight * scale);
      if (nextWidth === width && nextHeight === height) return true;
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      return true;
    },

    draw(video) {
      const started = performance.now();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      noteFrame(started);
    },

    stream() {
      if (!stream) stream = canvas.captureStream(0);
      return stream;
    },

    stats() {
      return { fps, frameMs };
    },

    destroy() {
      stream?.getVideoTracks?.().forEach((track) => {
        if (track.readyState === 'live') track.stop();
      });
      stream = null;
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
