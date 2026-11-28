const CHEEKS = [234, 93, 132, 58, 172, 136, 454, 323, 361, 288, 397, 365];
const JAW = [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397];
const NOSE = [98, 97, 2, 326, 327, 358, 279, 49, 48, 4, 5, 195];
const LEFT_EYE = [33, 133, 159, 145];
const RIGHT_EYE = [263, 362, 386, 374];
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;

const unit = (value) => Math.min(1, Math.max(0, Number(value) || 0) / 100);
const clamp = (value) => Math.min(0.07, Math.max(-0.07, value));

export function faceShapeActive(beauty) {
  if (!beauty) return false;
  return unit(beauty.slim) > 0 || unit(beauty.jaw) > 0 || unit(beauty.eye) > 0 || unit(beauty.nose) > 0;
}

const average = (face, indices) => {
  let x = 0;
  let y = 0;
  let count = 0;
  indices.forEach((index) => {
    const point = face[index];
    if (!point) return;
    x += point.x;
    y += point.y;
    count += 1;
  });
  return count ? { x: x / count, y: y / count } : null;
};

export function faceDelta(u, v, face, beauty) {
  if (!face || face.length < 300) return null;
  const slim = unit(beauty?.slim);
  const jaw = unit(beauty?.jaw);
  const eye = unit(beauty?.eye);
  const nose = unit(beauty?.nose);
  if (slim + jaw + eye + nose === 0) return [0, 0];

  const left = face[234];
  const right = face[454];
  const brow = face[10];
  const chin = face[152];
  const mid = face[1];
  if (!left || !right || !brow || !chin || !mid) return null;

  const centerX = (left.x + right.x) * 0.5;
  const centerY = (brow.y + chin.y) * 0.5;
  const faceW = Math.max(0.08, Math.abs(right.x - left.x));
  const faceH = Math.max(0.08, Math.abs(chin.y - brow.y));
  const nx = (u - centerX) / faceW;
  const ny = (v - centerY) / faceH;
  if (nx * nx + ny * ny > 1.15) return [0, 0];

  const sigma = faceW * 0.2;
  let dx = 0;
  let dy = 0;
  let weight = 0;
  const add = (point, shiftX, shiftY, reach) => {
    if (!point) return;
    const du = u - point.x;
    const dv = v - point.y;
    const pull = Math.exp(-(du * du + dv * dv) / (reach * reach));
    dx += shiftX * pull;
    dy += shiftY * pull;
    weight += pull;
  };

  if (slim > 0) {
    CHEEKS.forEach((index) => {
      const point = face[index];
      if (!point) return;
      add(point, (point.x - centerX) * slim * 0.28, 0, sigma);
    });
  }
  if (jaw > 0) {
    JAW.forEach((index) => {
      const point = face[index];
      if (!point) return;
      add(point, (point.x - centerX) * jaw * 0.16, jaw * 0.025, sigma * 0.85);
    });
  }
  if (nose > 0) {
    NOSE.forEach((index) => {
      const point = face[index];
      if (!point) return;
      add(point, (point.x - mid.x) * nose * 0.4, 0, faceW * 0.07);
    });
  }
  if (weight > 0) {
    dx /= weight;
    dy /= weight;
  }

  if (eye > 0) {
    const grow = (center) => {
      if (!center) return;
      const du = u - center.x;
      const dv = v - center.y;
      const dist = Math.hypot(du, dv);
      const radius = faceW * 0.13;
      if (!dist || dist > radius) return;
      const falloff = (1 - dist / radius) * eye * 0.42;
      dx += -du * falloff;
      dy += -dv * falloff;
    };
    grow(face[LEFT_IRIS] || average(face, LEFT_EYE));
    grow(face[RIGHT_IRIS] || average(face, RIGHT_EYE));
  }

  const inside = nx * nx + ny * ny;
  const envelope = inside < 0.2 ? 1 : Math.max(0, 1 - (inside - 0.2) / 0.95);
  return [clamp(dx * envelope), clamp(dy * envelope)];
}

export function followFace(previous, face) {
  if (!face || face.length < 300) return null;
  if (!previous || previous.length !== face.length) {
    return face.map((point) => ({ x: point.x, y: point.y }));
  }
  return face.map((point, index) => ({
    x: previous[index].x * 0.6 + point.x * 0.4,
    y: previous[index].y * 0.6 + point.y * 0.4,
  }));
}
