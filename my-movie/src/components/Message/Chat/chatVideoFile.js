const DB_NAME = 'violet-chat-videos';
const STORE = 'files';

const openDb = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') {
    reject(new Error('IndexedDB yo‘q'));
    return;
  }
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const run = async (mode, work) => {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const result = work(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

export const saveChatVideoFile = (id, blob) => {
  const key = String(id || '').trim();
  if (!key || !(blob instanceof Blob) || !blob.size) return Promise.resolve();
  return run('readwrite', (store) => {
    store.put(blob, key);
  }).catch(() => {});
};

export const readChatVideoFile = async (id) => {
  const key = String(id || '').trim();
  if (!key) return null;
  try {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).get(key);
        request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
};

const stillKey = (id) => `still:${id}`;
const MISS_KEY = 'violet-chat-still-miss';

export const saveChatVideoStill = (id, blob) => saveChatVideoFile(stillKey(id), blob);

export const readChatVideoStill = (id) => readChatVideoFile(stillKey(id));

export const dropChatVideoStill = (id) => {
  const key = String(id || '').trim();
  if (!key) return Promise.resolve();
  return run('readwrite', (store) => {
    store.delete(stillKey(key));
  }).catch(() => {});
};

const pixelsLookBlank = (data) => {
  let lit = 0;
  for (let i = 0; i < data.length; i += 16) {
    if (data[i] > 22 || data[i + 1] > 22 || data[i + 2] > 22) lit += 1;
  }
  return lit < 2;
};

export const frameLooksBlank = (blob) => new Promise((resolve) => {
  if (!(blob instanceof Blob) || !blob.size) {
    resolve(true);
    return;
  }
  const img = new Image();
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      URL.revokeObjectURL(url);
      resolve(false);
      return;
    }
    ctx.drawImage(img, 0, 0, 8, 8);
    const blank = pixelsLookBlank(ctx.getImageData(0, 0, 8, 8).data);
    URL.revokeObjectURL(url);
    resolve(blank);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    resolve(false);
  };
  img.src = url;
});

export const dropChatVideoFile = (id) => {
  const key = String(id || '').trim();
  if (!key) return Promise.resolve();
  return run('readwrite', (store) => {
    store.delete(key);
    store.delete(stillKey(key));
  }).catch(() => {});
};

export const stillWasMissed = (id) => {
  try {
    const list = JSON.parse(localStorage.getItem(MISS_KEY) || '[]');
    return Array.isArray(list) && list.includes(String(id || ''));
  } catch {
    return false;
  }
};

export const rememberStillMiss = (id) => {
  const key = String(id || '').trim();
  if (!key) return;
  try {
    const list = JSON.parse(localStorage.getItem(MISS_KEY) || '[]');
    const next = Array.isArray(list) ? list.filter((item) => item !== key) : [];
    next.push(key);
    localStorage.setItem(MISS_KEY, JSON.stringify(next.slice(-200)));
  } catch {
    /* Kadr belgisi saqlanmasa, keyingi kirish yana bir marta urunadi. */
  }
};

export const captureChatPoster = (blob, at = 0) => new Promise((resolve) => {
  if (!(blob instanceof Blob) || !blob.size) {
    resolve(null);
    return;
  }
  const video = document.createElement('video');
  const url = URL.createObjectURL(blob);
  let settled = false;
  const finish = (value) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    URL.revokeObjectURL(url);
    video.removeAttribute('src');
    video.load();
    resolve(value);
  };
  const timer = window.setTimeout(() => finish(null), 4000);
  const shoot = () => {
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) {
      finish(null);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      finish(null);
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((jpeg) => finish(jpeg && jpeg.size ? jpeg : null), 'image/jpeg', 0.72);
  };
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.onerror = () => finish(null);
  video.onloadeddata = () => {
    const target = Math.max(0, Number(at) || 0);
    if (target <= 0.05) {
      shoot();
      return;
    }
    video.addEventListener('seeked', () => shoot(), { once: true });
    try {
      video.currentTime = target;
    } catch {
      shoot();
    }
  };
  video.src = url;
});

let stillQueue = Promise.resolve();

const shootRemoteStill = (url, at = 0) => new Promise((resolve) => {
  const video = document.createElement('video');
  let settled = false;
  let tries = 0;
  const finish = (value) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    video.removeAttribute('src');
    video.load();
    video.remove();
    resolve(value);
  };
  const timer = window.setTimeout(() => finish(null), 8000);
  const shoot = () => {
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) {
      finish(null);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      finish(null);
      return;
    }
    try {
      ctx.drawImage(video, 0, 0, width, height);
    } catch {
      finish(null);
      return;
    }
    const sample = document.createElement('canvas');
    sample.width = 8;
    sample.height = 8;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    if (sampleCtx) {
      sampleCtx.drawImage(canvas, 0, 0, 8, 8);
      if (pixelsLookBlank(sampleCtx.getImageData(0, 0, 8, 8).data) && tries < 1) {
        tries += 1;
        const next = Math.min((Number(video.currentTime) || 0) + 0.4, Math.max(0.12, (video.duration || 1) - 0.05));
        video.addEventListener('seeked', () => window.requestAnimationFrame(shoot), { once: true });
        try {
          video.currentTime = next;
        } catch {
          finish(null);
        }
        return;
      }
    }
    canvas.toBlob((jpeg) => finish(jpeg && jpeg.size ? jpeg : null), 'image/jpeg', 0.72);
  };
  const place = () => {
    const target = Math.min(
      Math.max(0.12, Number(at) || 0),
      Math.max(0.12, (video.duration || 1) - 0.05)
    );
    const afterSeek = () => {
      const kick = video.play();
      const draw = () => window.requestAnimationFrame(shoot);
      if (kick && typeof kick.then === 'function') kick.then(() => { video.pause(); draw(); }).catch(draw);
      else draw();
    };
    video.addEventListener('seeked', afterSeek, { once: true });
    try {
      video.currentTime = target;
    } catch {
      afterSeek();
    }
  };
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.setAttribute('style', 'position:fixed;left:-9999px;width:8px;height:8px;opacity:0;pointer-events:none');
  video.onerror = () => finish(null);
  video.onloadeddata = place;
  document.body.appendChild(video);
  video.src = url;
});

export const captureRemoteStill = (url, at = 0) => {
  const source = String(url || '').trim();
  if (!source || source.startsWith('blob:')) return Promise.resolve(null);
  const job = stillQueue.then(() => shootRemoteStill(source, at));
  stillQueue = job.then(() => {}, () => {});
  return job;
};
