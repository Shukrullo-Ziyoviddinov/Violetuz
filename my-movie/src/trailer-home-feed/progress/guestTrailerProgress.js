/* global globalThis */
import { validateProgressReport, mergeSessionProgress, summarizeProgress } from './progressProtocol';

export const GUEST_TRAILER_PROGRESS_PREFIX = 'violet_trailer_home_progress_v1:';
const MAX_SESSIONS = 200;

export function createTrailerSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// One key per session avoids overwriting other tabs' independent playback sessions.
export function createGuestTrailerProgressStore({ storage, now = Date.now } = {}) {
  const getStorage = () => {
    try { return storage === undefined ? globalThis.localStorage : storage; } catch { return null; }
  };
  const keyFor = (report) => `${GUEST_TRAILER_PROGRESS_PREFIX}${report.movieId}:${report.trailerId}:${report.sessionId}`;
  const readSessions = () => {
    const target = getStorage();
    if (!target) return [];
    try {
      const rows = [];
      for (let i = 0; i < target.length; i += 1) {
        const key = target.key(i);
        if (!key?.startsWith(GUEST_TRAILER_PROGRESS_PREFIX)) continue;
        try {
          const value = JSON.parse(target.getItem(key));
          const progress = validateProgressReport(value.progress);
          if (key !== keyFor(progress) || !Number.isFinite(value.updatedAt)) continue;
          const createdAt = Number.isFinite(value.createdAt) && value.createdAt <= value.updatedAt ? value.createdAt : value.updatedAt;
          rows.push({ key, progress, createdAt, updatedAt: value.updatedAt });
        } catch { /* Ignore corrupt or unrelated entries. */ }
      }
      return rows;
    } catch { return []; }
  };
  return {
    save(input) {
      const report = validateProgressReport(input);
      const target = getStorage();
      if (!target) return { stored: 'local', ok: false, changed: false };
      try {
        const key = keyFor(report);
        let previous = null;
        let createdAt = now();
        try {
          const raw = JSON.parse(target.getItem(key));
          if (raw?.progress) previous = validateProgressReport(raw.progress);
          if (Number.isFinite(raw?.createdAt)) createdAt = raw.createdAt;
          else if (Number.isFinite(raw?.updatedAt)) createdAt = raw.updatedAt;
        } catch { /* Replace malformed data. */ }
        const merged = mergeSessionProgress(previous, report);
        const changed = !previous || JSON.stringify(validateProgressReport(previous)) !== JSON.stringify(merged);
        if (changed && merged.totalPlayedSeconds > 0) {
          target.setItem(key, JSON.stringify({ progress: merged, createdAt, updatedAt: now() }));
          const sessions = readSessions().sort((a, b) => b.updatedAt - a.updatedAt);
          sessions.slice(MAX_SESSIONS).forEach((row) => target.removeItem(row.key));
        }
        return { stored: 'local', ok: true, changed: changed && merged.totalPlayedSeconds > 0, progress: merged };
      } catch (error) {
        if (error instanceof TypeError) throw error;
        return { stored: 'local', ok: false, changed: false };
      }
    },
    read(movieId, trailerId) {
      const sessions = readSessions().filter((row) => row.progress.movieId === Number(movieId) && row.progress.trailerId === Number(trailerId));
      return { movieId: Number(movieId), trailerId: Number(trailerId), ...summarizeProgress(sessions.map((row) => row.progress)) };
    },
    history() { return readSessions().sort((a, b) => b.updatedAt - a.updatedAt).map((row) => ({ ...row.progress, createdAt: row.createdAt, updatedAt: row.updatedAt })); },
  };
}
