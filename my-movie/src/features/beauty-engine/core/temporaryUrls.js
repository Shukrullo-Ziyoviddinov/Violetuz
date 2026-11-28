const urls = new Set();

export function rememberTemporaryUrl(url) {
  if (typeof url === 'string' && url.startsWith('blob:')) urls.add(url);
  return url;
}

export function revokeTemporaryUrl(url) {
  if (typeof url !== 'string' || !urls.has(url)) return;
  urls.delete(url);
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* manzil allaqachon yopilgan */
  }
}

export function revokeTemporaryUrls() {
  [...urls].forEach((url) => revokeTemporaryUrl(url));
}

export function temporaryUrlCount() {
  return urls.size;
}
