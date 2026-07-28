let authModalHandler = null;

export function setAuthModalHandler(fn) {
  authModalHandler = typeof fn === 'function' ? fn : null;
}

export function clearAuthModalHandler(fn) {
  if (authModalHandler === fn) {
    authModalHandler = null;
  }
}

/** @param {'register'|'login'} [mode] */
export function requestOpenAuthModal(mode = 'register') {
  authModalHandler?.(mode);
}
