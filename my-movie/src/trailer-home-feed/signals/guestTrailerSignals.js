/* global globalThis */
import { createTrailerSessionId } from '../progress/guestTrailerProgress';
import { validateSignalAction, signalDay } from './signalProtocol';

export const GUEST_TRAILER_SIGNAL_PREFIX = 'violet_trailer_home_signal_v1:';
const MAX_EVENTS = 600;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Create ONCE at the actual user action. Reuse the object/eventId for all retries.
export const createTrailerSignalAction = (input) => validateSignalAction({ ...input, eventId: input.eventId || createTrailerSessionId() });

export function createGuestTrailerSignalStore({ storage, now = Date.now } = {}) {
  const getStorage = () => { try { return storage === undefined ? globalThis.localStorage : storage; } catch { return null; } };
  const readAll = () => {
    const target = getStorage();
    const rows = [];
    if (!target) return rows;
    try {
      for (let i = 0; i < target.length; i += 1) {
        const key = target.key(i);
        if (!key?.startsWith(GUEST_TRAILER_SIGNAL_PREFIX)) continue;
        try {
          const row = JSON.parse(target.getItem(key));
          const action = validateSignalAction(row.action);
          if (key !== `${GUEST_TRAILER_SIGNAL_PREFIX}${action.eventId}` || !Number.isFinite(row.occurredAt)
            || row.occurredAt > now() || row.occurredAt < now() - MAX_AGE_MS || signalDay(row.occurredAt) !== row.day) continue;
          rows.push({ ...row, action, key });
        } catch { /* Ignore invalid local data. */ }
      }
    } catch { return []; }
    return rows;
  };
  return {
    save(input) {
      const action = validateSignalAction(input);
      const target = getStorage();
      if (!target) return { stored: 'local', ok: false, changed: false };
      try {
        const key = `${GUEST_TRAILER_SIGNAL_PREFIX}${action.eventId}`;
        // Event receipt survives the UTC day boundary. It never becomes a new action on retry.
        const existing = target.getItem(key);
        if (existing) {
          try {
            const receipt = JSON.parse(existing);
            const saved = validateSignalAction(receipt.action);
            if (saved.eventId === action.eventId && Number.isFinite(receipt.occurredAt)
              && receipt.day === signalDay(receipt.occurredAt)) return { stored: 'local', ok: true, changed: false };
          } catch { /* A corrupt receipt must not permanently block this action. */ }
        }
        const occurredAt = now();
        target.setItem(key, JSON.stringify({ action, occurredAt, day: signalDay(occurredAt) }));
        const rows = readAll().sort((a, b) => b.occurredAt - a.occurredAt);
        const keep = new Set(rows.slice(0, MAX_EVENTS).map((row) => row.key));
        const remove = [];
        for (let i = 0; i < target.length; i += 1) {
          const entryKey = target.key(i);
          if (entryKey?.startsWith(GUEST_TRAILER_SIGNAL_PREFIX) && !keep.has(entryKey)) remove.push(entryKey);
        }
        remove.forEach((entryKey) => target.removeItem(entryKey));
        return { stored: 'local', ok: true, changed: true };
      } catch { return { stored: 'local', ok: false, changed: false }; }
    },
    today(movieId, trailerId) {
      const day = signalDay(now());
      const byType = new Map();
      for (const row of readAll()) {
        if (row.day === day && row.action.movieId === Number(movieId) && row.action.trailerId === Number(trailerId)) {
          if (!byType.has(row.action.type)) byType.set(row.action.type, { type: row.action.type, occurredAt: row.occurredAt });
        }
      }
      return [...byType.values()];
    },
    history() { return readAll().sort((a, b) => b.occurredAt - a.occurredAt).map(({ action, occurredAt, day }) => ({ ...action, occurredAt, day })); },
  };
}
