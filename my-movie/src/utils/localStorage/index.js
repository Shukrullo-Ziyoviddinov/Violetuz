/**
 * Browser localStorage domain modules.
 * Add future prefs/keys here (theme, drafts, …) — keep guestHistory nested.
 */

export * from './guestHistory';
export {
  TRILLER_GUEST_PROGRESS_STORAGE_KEY,
  getGuestTrillerProgress,
  recordGuestTrillerProgress,
} from './trillerGuestProgress';
