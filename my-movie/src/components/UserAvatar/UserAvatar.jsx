import { useEffect, useRef, useState } from 'react';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const isHttpUrl = (value) =>
  typeof value === 'string' && /^https?:\/\//i.test(value.trim());

const withCacheBust = (url, nonce) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('v', String(nonce));
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${nonce}`;
  }
};

/**
 * Avatar img: first CDN/cache miss does not hide the image.
 * Retries with ?v=… then shows fallback only after retries fail.
 */
const UserAvatar = ({
  src,
  className,
  alt = '',
  fallback = null,
  referrerPolicy = 'no-referrer',
}) => {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [bust, setBust] = useState(0);
  const retryTimerRef = useRef(0);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
    setBust(0);
    window.clearTimeout(retryTimerRef.current);
  }, [src]);

  useEffect(
    () => () => {
      window.clearTimeout(retryTimerRef.current);
    },
    []
  );

  if (!src || failed) {
    return fallback;
  }

  const displaySrc = attempt > 0 && isHttpUrl(src) ? withCacheBust(src, bust) : src;

  return (
    <img
      key={`${src}:${attempt}`}
      src={displaySrc}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      decoding="async"
      onError={() => {
        if (!isHttpUrl(src) || attempt >= MAX_RETRIES) {
          setFailed(true);
          return;
        }
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = window.setTimeout(() => {
          setBust(Date.now());
          setAttempt((n) => n + 1);
        }, RETRY_DELAY_MS * (attempt + 1));
      }}
    />
  );
};

export default UserAvatar;
