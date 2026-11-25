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

export const dropChatVideoFile = (id) => {
  const key = String(id || '').trim();
  if (!key) return Promise.resolve();
  return run('readwrite', (store) => {
    store.delete(key);
  }).catch(() => {});
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
