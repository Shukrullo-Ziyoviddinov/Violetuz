/** Register verify dan keyin avatar majburiy — refresh da qayta ochish uchun */
export const NEEDS_AVATAR_KEY = 'violetNeedsAvatar';

let authModalHandler = null;

export function setAuthModalHandler(fn) {
  authModalHandler = typeof fn === 'function' ? fn : null;
}

export function clearAuthModalHandler(fn) {
  if (authModalHandler === fn) {
    authModalHandler = null;
  }
}

/**
 * @param {'register'|'login'} [mode]
 * @param {{ step?: 'form'|'avatar' }} [options]
 */
export function requestOpenAuthModal(mode = 'register', options = {}) {
  authModalHandler?.(mode, options);
}

export function markNeedsAvatar() {
  try {
    sessionStorage.setItem(NEEDS_AVATAR_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function clearNeedsAvatar() {
  try {
    sessionStorage.removeItem(NEEDS_AVATAR_KEY);
  } catch {
    /* private mode */
  }
}

export function readNeedsAvatar() {
  try {
    return sessionStorage.getItem(NEEDS_AVATAR_KEY) === '1';
  } catch {
    return false;
  }
}
