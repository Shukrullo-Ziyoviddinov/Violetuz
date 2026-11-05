import { resolveApiBaseUrl } from '../../api/apiBase';
import { validateProgressReport } from './progressProtocol';
import { createTrailerWatchTracker } from '../watch/createTrailerWatchTracker';

// Serialize initial handshakes across players so parallel starts share one cookie.
let handshake = Promise.resolve();
const request = async (path, body) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/trailer-home-guest-progress${path}`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), keepalive: true, signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok || data?.success !== true) throw new Error('Guest trend report rejected');
    return data.data;
  } finally { clearTimeout(timer); }
};

export function createGuestTrendReporter({ isGuest, transport = request }) {
  const sessions = new Map();
  const start = (input) => {
    const report = validateProgressReport(input);
    if (sessions.has(report.sessionId)) return sessions.get(report.sessionId).ready;
    const row = { ticket: null, pending: Promise.resolve() };
    row.ready = handshake.catch(() => {}).then(async () => {
      if (!isGuest()) return;
      const result = await transport('/session', { movieId: report.movieId, trailerId: report.trailerId,
        sessionId: report.sessionId, durationSec: report.durationSec });
      row.ticket = result.ticket;
      // Count global guest evidence only after the server establishes this session.
      // Slow/offline handshakes must never backdate arbitrary local viewing history.
      row.tracker = createTrailerWatchTracker({ durationSec: report.durationSec });
    }).catch(() => {});
    handshake = row.ready;
    sessions.set(report.sessionId, row);
    return row.ready;
  };
  const observe = (sample, sessionId) => {
    const row = sessions.get(sessionId);
    if (!row?.tracker) return;
    if (!row.seeded && sample.event === 'sample' && sample.playing && sample.visible) {
      row.tracker.note({ ...sample, event: 'playing' });
    }
    row.seeded = true;
    row.tracker.note(sample);
  };
  const save = (input) => {
    const report = validateProgressReport(input);
    const row = sessions.get(report.sessionId);
    // Historical local sessions are never bulk-uploaded into global trending.
    if (!row) return Promise.resolve();
    const snapshot = row.tracker?.snapshot();
    if (!snapshot?.totalPlayedSeconds) return row.ready;
    const liveReport = validateProgressReport({ ...report, ...snapshot });
    row.pending = row.pending.then(() => row.ready).then(() => {
      if (!isGuest() || !row.ticket) return;
      return transport('', { ...liveReport, ticket: row.ticket });
    }).catch(() => {});
    return row.pending;
  };
  return { start, save, observe };
}
