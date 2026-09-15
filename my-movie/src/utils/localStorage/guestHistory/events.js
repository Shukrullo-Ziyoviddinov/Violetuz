/**
 * Cross-component signals when guest local history changes
 * (Home/Music hooks re-fetch without remount).
 */

export const GUEST_MOVIE_HISTORY_CHANGED = 'violet:guest-movie-history-changed';
export const GUEST_MUSIC_HISTORY_CHANGED = 'violet:guest-music-history-changed';

export function emitGuestMovieHistoryChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GUEST_MOVIE_HISTORY_CHANGED));
}

export function emitGuestMusicHistoryChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GUEST_MUSIC_HISTORY_CHANGED));
}
