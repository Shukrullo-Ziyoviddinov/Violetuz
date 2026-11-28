import { gradeActive } from '../config/beautyConfig.js';
import { backgroundActive, backgroundFragment, blurFragment, hexToRgb } from './background.js';
import { createBackgroundPlate } from './backgroundPlate.js';
import { contourAmount, contourFragment } from './contour.js';
import { filterFragment } from './filter.js';
import { createFaceWarp } from './faceWarp.js';
import { faceShapeActive } from './faceShape.js';
import { createFeatureMask, hairBuffer } from './featureMask.js';
import { lightAmount, lightFragment } from './light.js';
import { skinActive, skinFragment, skinRetouch, skinTone } from './skin.js';
import { smoothAmount, smoothFragment } from './smooth.js';

const VERT = `
attribute vec2 aPos;
attribute vec2 aUv;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const BLIT = `
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

const link = (gl, fragment) => {
  const vert = compile(gl, gl.VERTEX_SHADER, VERT);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.bindAttribLocation(program, 1, 'aUv');
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
};

const makeTexture = (gl) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
};

const makeTarget = (gl) => {
  const texture = makeTexture(gl);
  const framebuffer = gl.createFramebuffer();
  return { texture, framebuffer };
};

const bindTarget = (gl, target, width, height) => {
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
  return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
};

export function effectsActive(beauty) {
  if (!beauty) return false;
  return smoothAmount(beauty) > 0 || skinActive(beauty) || lightAmount(beauty) > 0 || contourAmount(beauty) > 0;
}

export function frameNeedsModel(beauty) {
  return effectsActive(beauty) || faceShapeActive(beauty);
}

export { hairBuffer };

export function createEffectPipeline(gl) {
  const blit = link(gl, BLIT);
  const blurProgram = link(gl, blurFragment);
  const backgroundProgram = link(gl, backgroundFragment);
  const filterProgram = link(gl, filterFragment);
  const programs = {
    smooth: link(gl, smoothFragment),
    skin: link(gl, skinFragment),
    light: link(gl, lightFragment),
    contour: link(gl, contourFragment),
  };
  if (!blit) return null;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    1, 1, 1, 0,
  ]), gl.STATIC_DRAW);

  const source = makeTexture(gl);
  const mask = makeTexture(gl);
  const hair = makeTexture(gl);
  const targets = [makeTarget(gl), makeTarget(gl)];
  const featureMask = createFeatureMask();
  const faceWarp = createFaceWarp(gl);
  const plate = createBackgroundPlate();
  const plateTexture = makeTexture(gl);
  const personTexture = makeTexture(gl);
  const blurTarget = makeTarget(gl);
  const hold = makeTarget(gl);
  const stage = makeTarget(gl);
  let width = 0;
  let height = 0;
  let maskBytes = new Uint8Array(4);

  const bindQuad = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  };

  const uploadImage = (texture, image) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  };

  const uploadMask = (texture, packed) => {
    const maskWidth = Math.max(1, packed?.width || 1);
    const maskHeight = Math.max(1, packed?.height || 1);
    const count = maskWidth * maskHeight;
    if (maskBytes.length !== count * 4) maskBytes = new Uint8Array(count * 4);
    else maskBytes.fill(0);
    const data = packed?.data;
    if (data) {
      const limit = Math.min(data.length, count);
      for (let index = 0; index < limit; index += 1) {
        const offset = index * 4;
        maskBytes[offset] = data[index];
        maskBytes[offset + 3] = 255;
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, maskWidth, maskHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, maskBytes);
  };

  const drawPass = (program, input, uniforms) => {
    gl.useProgram(program);
    bindQuad();
    const pairs = [
      ['uTex', input, 0],
      ['uSource', source, 1],
      ['uMask', mask, 2],
      ['uHair', hair, 3],
    ];
    pairs.forEach(([name, texture, unit]) => {
      const location = gl.getUniformLocation(program, name);
      if (!location) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(location, unit);
    });
    const amount = gl.getUniformLocation(program, 'uAmount');
    if (amount) gl.uniform1f(amount, uniforms.amount || 0);
    const retouch = gl.getUniformLocation(program, 'uRetouch');
    if (retouch) gl.uniform1f(retouch, uniforms.retouch || 0);
    const tone = gl.getUniformLocation(program, 'uTone');
    if (tone) gl.uniform1f(tone, uniforms.tone || 0);
    const texel = gl.getUniformLocation(program, 'uTexel');
    if (texel) gl.uniform2f(texel, 1 / width, 1 / height);
    const nose = gl.getUniformLocation(program, 'uNose');
    if (nose) gl.uniform2f(nose, uniforms.nose?.x ?? 0.5, uniforms.nose?.y ?? 0.45);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const uploadPerson = (packed) => {
    uploadMask(personTexture, packed);
  };

  const drawFilter = (input, grade) => {
    if (!filterProgram || !grade) return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(filterProgram);
    bindQuad();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input);
    gl.uniform1i(gl.getUniformLocation(filterProgram, 'uTex'), 0);
    gl.uniform2f(gl.getUniformLocation(filterProgram, 'uTexel'), 1 / width, 1 / height);
    const unit = (name) => (grade[name] || 0) / 100;
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uBrightness'), unit('brightness'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uContrast'), unit('contrast'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uSaturation'), unit('saturation'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uExposure'), unit('exposure'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uTemperature'), unit('temperature'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uTint'), unit('tint'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uHighlights'), unit('highlights'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uShadows'), unit('shadows'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uGamma'), unit('gamma'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uVibrance'), unit('vibrance'));
    gl.uniform1f(gl.getUniformLocation(filterProgram, 'uSharpness'), unit('sharpness'));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  };

  const drawBackground = (person, background, personPack, destination) => {
    if (!backgroundProgram || !personPack) return false;
    plate.sync(background);
    const mode = background.mode;
    const kind = mode === 'solid' ? 0 : (mode === 'gradient' ? 1 : 2);
    if (kind === 2 && mode === 'blur') {
      if (!blurProgram || !bindTarget(gl, blurTarget, width, height)) return false;
      gl.useProgram(blurProgram);
      bindQuad();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source);
      gl.uniform1i(gl.getUniformLocation(blurProgram, 'uTex'), 0);
      gl.uniform1f(gl.getUniformLocation(blurProgram, 'uAmount'), (background.amount || 0) / 100);
      gl.uniform2f(gl.getUniformLocation(blurProgram, 'uTexel'), 1 / width, 1 / height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (kind === 2) {
      const media = plate.source();
      if (!plate.ready(mode) || !media) return false;
      try {
        gl.bindTexture(gl.TEXTURE_2D, plateTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, media);
      } catch {
        plate.block();
        return false;
      }
    }
    if (destination) {
      if (!bindTarget(gl, destination, width, height)) return false;
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, width, height);
    gl.useProgram(backgroundProgram);
    bindQuad();
    uploadPerson(personPack);
    const bind = (name, texture, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(backgroundProgram, name), unit);
    };
    bind('uPerson', person, 0);
    bind('uPlate', mode === 'blur' ? blurTarget.texture : plateTexture, 1);
    bind('uMask', personTexture, 2);
    const colorA = hexToRgb(mode === 'gradient' ? background.from : background.color);
    const colorB = hexToRgb(background.to);
    gl.uniform3f(gl.getUniformLocation(backgroundProgram, 'uColorA'), colorA[0], colorA[1], colorA[2]);
    gl.uniform3f(gl.getUniformLocation(backgroundProgram, 'uColorB'), colorB[0], colorB[1], colorB[2]);
    gl.uniform1f(gl.getUniformLocation(backgroundProgram, 'uKind'), kind);
    gl.uniform2f(gl.getUniformLocation(backgroundProgram, 'uFrame'), width, height);
    const media = plate.source();
    const mediaWidth = media?.videoWidth || media?.naturalWidth || 0;
    const mediaHeight = media?.videoHeight || media?.naturalHeight || 0;
    gl.uniform2f(gl.getUniformLocation(backgroundProgram, 'uMedia'), mediaWidth, mediaHeight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  };

  return {
    draw(video, beauty, landmarks, hairPack, scene = {}) {
      if (!width || !height) return false;
      const nose = featureMask?.paint(width, height, landmarks) || null;
      uploadImage(source, video);
      if (featureMask) uploadImage(mask, featureMask.canvas);
      try {
        uploadMask(hair, hairPack);
      } catch {
        uploadMask(hair, null);
      }

      const passes = [
        programs.smooth && smoothAmount(beauty) > 0 ? { program: programs.smooth, amount: smoothAmount(beauty) } : null,
        programs.skin && skinActive(beauty) ? { program: programs.skin, retouch: skinRetouch(beauty), tone: skinTone(beauty) } : null,
        programs.light && lightAmount(beauty) > 0 ? { program: programs.light, amount: lightAmount(beauty) } : null,
        programs.contour && contourAmount(beauty) > 0 ? { program: programs.contour, amount: contourAmount(beauty), nose } : null,
      ].filter(Boolean);

      let current = source;
      passes.forEach((pass, index) => {
        const target = targets[index % 2];
        if (!bindTarget(gl, target, width, height)) return;
        gl.viewport(0, 0, width, height);
        drawPass(pass.program, current, pass);
        current = target.texture;
      });

      const background = scene.background;
      const personPack = scene.person;
      const grade = scene.grade;
      const needsGrade = gradeActive(grade);
      const replace = backgroundActive(background) && personPack && !plate.failed();
      let picture = current;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      if (landmarks && faceWarp && faceShapeActive(beauty) && (replace || needsGrade)) {
        if (bindTarget(gl, hold, width, height) && faceWarp.draw(current, landmarks, beauty)) {
          picture = hold.texture;
        }
      } else if (landmarks && faceWarp?.draw(current, landmarks, beauty)) {
        return true;
      }
      if (replace && drawBackground(picture, background, personPack, needsGrade ? stage : null)) {
        if (!needsGrade) return true;
        picture = stage.texture;
      }
      if (needsGrade && drawFilter(picture, grade)) return true;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      drawPass(blit, picture, {});
      return true;
    },

    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
    },

    destroy() {
      faceWarp?.destroy();
      featureMask?.destroy();
      plate.destroy();
      [blit, blurProgram, backgroundProgram, filterProgram, programs.smooth, programs.skin, programs.light, programs.contour]
        .forEach((program) => {
          if (program) gl.deleteProgram(program);
        });
      gl.deleteBuffer(buffer);
      [source, mask, hair, plateTexture, personTexture, targets[0].texture, targets[1].texture, blurTarget.texture, hold.texture, stage.texture].forEach((texture) => gl.deleteTexture(texture));
      [targets[0], targets[1], blurTarget, hold, stage].forEach((target) => gl.deleteFramebuffer(target.framebuffer));
    },
  };
}
