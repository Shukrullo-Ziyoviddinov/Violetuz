/**
 * Cross-component signals when guest local history changes
 * (Home/Music hooks re-fetch without remount).
 */

export const GUEST_MOVIE_HISTORY_CHANGED = 'violet:guest-movie-history-changed';
export const GUEST_MUSIC_HISTORY_CHANGED = 'violet:guest-music-history-changed';
/** Guest mix play-count ledger (violet_guest_music_mix_plays_v1) — not rec history. */
export const GUEST_MUSIC_MIX_PLAYS_CHANGED = 'violet:guest-music-mix-plays-changed';

export function emitGuestMovieHistoryChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GUEST_MOVIE_HISTORY_CHANGED));
}

export function emitGuestMusicHistoryChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GUEST_MUSIC_HISTORY_CHANGED));
}

export function emitGuestMusicMixPlaysChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GUEST_MUSIC_MIX_PLAYS_CHANGED));
}
