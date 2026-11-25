import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const uploadsFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Upload request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * Ask backend for a short-lived R2 PUT URL.
 * File bytes must be uploaded with putFileToR2 — never sent to Node.
 */
export const requestPresign = async ({ folder, contentType, filename }) => {
  const res = await uploadsFetch('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ folder, contentType, filename }),
  });
  return parseJson(res);
};

/** PUT file bytes directly to Cloudflare R2 (presigned URL). */
export const putFileToR2 = async (uploadUrl, file, headers = {}, { onProgress, signal } = {}) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  const fail = (status) => {
    const err = new Error('R2 ga yuklash muvaffaqiyatsiz');
    err.status = status || 0;
    reject(err);
  };
  xhr.open('PUT', uploadUrl);
  Object.entries(headers).forEach(([name, value]) => {
    if (value) xhr.setRequestHeader(name, value);
  });
  if (!headers['Content-Type'] && file.type) xhr.setRequestHeader('Content-Type', file.type);
  xhr.upload.onprogress = (event) => {
    if (!event.lengthComputable) return;
    onProgress?.(event.total ? event.loaded / event.total : 0);
  };
  xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : fail(xhr.status));
  xhr.onerror = () => fail(xhr.status);
  xhr.onabort = () => {
    const err = new Error('Yuklash to‘xtatildi');
    err.name = 'AbortError';
    reject(err);
  };
  if (signal) {
    if (signal.aborted) {
      const err = new Error('Yuklash to‘xtatildi');
      err.name = 'AbortError';
      reject(err);
      return;
    }
    signal.addEventListener('abort', () => xhr.abort(), { once: true });
  }
  xhr.send(file);
});

export const deleteUpload = async ({ key, url } = {}) => {
  const res = await uploadsFetch('/uploads/delete', {
    method: 'POST',
    body: JSON.stringify({ key, url }),
  });
  return parseJson(res);
};

/**
 * Full direct-to-R2 loop for one file.
 * @returns {{ key: string, publicUrl: string }}
 */
export const uploadFileDirectToR2 = async ({ folder, file }) => {
  const presign = await requestPresign({
    folder,
    contentType: file.type,
    filename: file.name,
  });

  const payload = presign;
  const uploadUrl = payload.uploadUrl;
  const publicUrl = payload.publicUrl;
  const key = payload.key;
  const putHeaders = payload.headers || { 'Content-Type': file.type };

  if (!uploadUrl || !publicUrl) {
    throw new Error('Presign javobi noto‘g‘ri');
  }

  await putFileToR2(uploadUrl, file, putHeaders);
  return { key, publicUrl };
};
