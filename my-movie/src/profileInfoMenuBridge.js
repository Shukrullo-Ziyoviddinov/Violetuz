let profileInfoMenuHandler = null;

export function setProfileInfoMenuHandler(fn) {
  profileInfoMenuHandler = typeof fn === 'function' ? fn : null;
}

export function clearProfileInfoMenuHandler(fn) {
  if (profileInfoMenuHandler === fn) {
    profileInfoMenuHandler = null;
  }
}

export function requestOpenProfileInfoMenu() {
  profileInfoMenuHandler?.();
}
