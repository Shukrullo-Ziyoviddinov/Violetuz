const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
const LEFT_BROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const RIGHT_BROW = [336, 296, 334, 293, 300, 285, 295, 282, 283, 276];
const LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];

const HAIR_CLASS = 1;

const pointsOf = (face, indices) => {
  const points = [];
  indices.forEach((index) => {
    const point = face[index];
    if (point) points.push(point);
  });
  return points.length >= 3 ? points : null;
};

const trace = (ctx, points, width, height) => {
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = point.x * width;
    const y = (1 - point.y) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
};

export function createFeatureMask() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cut = (face, indices, width, height, thickness) => {
    const points = pointsOf(face, indices);
    if (!points) return;
    trace(ctx, points, width, height);
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.fill();
  };

  return {
    canvas,

    paint(width, height, landmarks) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      const face = landmarks;
      const oval = face ? pointsOf(face, FACE_OVAL) : null;
      if (!oval) return null;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';
      trace(ctx, oval, width, height);
      ctx.fill();

      const left = face[234];
      const right = face[454];
      const span = left && right
        ? Math.hypot((right.x - left.x) * width, (right.y - left.y) * height)
        : width * 0.35;
      const thick = Math.max(6, span * 0.09);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      cut(face, LEFT_EYE, width, height, thick);
      cut(face, RIGHT_EYE, width, height, thick);
      cut(face, LEFT_BROW, width, height, thick * 0.85);
      cut(face, RIGHT_BROW, width, height, thick * 0.85);
      cut(face, LIPS, width, height, thick * 0.7);
      ctx.globalCompositeOperation = 'source-over';

      const nose = face[1] || face[4];
      return nose ? { x: nose.x, y: nose.y } : { x: 0.5, y: 0.45 };
    },

    destroy() {
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}

export function hairBuffer(categoryMask) {
  if (!categoryMask || typeof categoryMask.getAsUint8Array !== 'function') return null;
  const source = categoryMask.getAsUint8Array();
  if (!source?.length || !categoryMask.width || !categoryMask.height) return null;
  const data = new Uint8Array(source.length);
  let hairPixels = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== HAIR_CLASS) continue;
    data[index] = 255;
    hairPixels += 1;
  }
  if (!hairPixels || hairPixels > source.length * 0.7) return null;
  return { data, width: categoryMask.width, height: categoryMask.height };
}
