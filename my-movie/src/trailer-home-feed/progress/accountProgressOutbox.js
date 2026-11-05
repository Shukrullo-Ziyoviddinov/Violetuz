import { mergeSessionProgress, validateProgressReport } from './progressProtocol';

export const ACCOUNT_PROGRESS_OUTBOX_PREFIX = 'violet_trailer_account_outbox_v1:';

// Synchronous durable writes also work during pagehide. Retain retryable reports.
export function createAccountProgressOutbox({ storage, currentAccount, send }) {
  let flight = null;
  let controller = null;
  const target = () => storage === undefined ? window.localStorage : storage;
  const keyFor = (accountId, report) => `${ACCOUNT_PROGRESS_OUTBOX_PREFIX}${encodeURIComponent(accountId)}:${report.movieId}:${report.trailerId}:${report.sessionId}`;
  const enqueue = (accountId, input) => {
    if (!accountId) throw new TypeError('Account identity required');
    const report = validateProgressReport(input);
    const key = keyFor(String(accountId), report);
    const db = target();
    const previous = db.getItem(key);
    let old;
    try {
      const row = JSON.parse(previous);
      if (row?.accountId === String(accountId)) old = validateProgressReport(row.report);
    } catch { /* A corrupt local entry must not prevent saving a fresh valid snapshot. */ }
    const progress = old ? mergeSessionProgress(old, report) : report;
    db.setItem(key, JSON.stringify({ accountId: String(accountId), report: progress }));
  };
  const flush = () => {
    if (flight) return flight;
    const accountId = currentAccount();
    if (!accountId) return Promise.resolve();
    controller = new AbortController();
    const signal = controller.signal;
    flight = (async () => {
      const db = target();
      const keys = [];
      for (let i = 0; i < db.length; i++) {
        const key = db.key(i);
        if (key?.startsWith(ACCOUNT_PROGRESS_OUTBOX_PREFIX)) keys.push(key);
      }
      for (const key of keys) {
        if (signal.aborted || currentAccount() !== accountId) break;
        const value = db.getItem(key);
        let row;
        try {
          row = JSON.parse(value);
          if (row.accountId !== accountId) continue;
          row.report = validateProgressReport(row.report);
          if (keyFor(accountId, row.report) !== key) continue;
        } catch { continue; }
        try {
          const timeout = setTimeout(() => controller?.abort(), 15000);
          try { await send(row.report, signal, accountId); } finally { clearTimeout(timeout); }
        } catch (error) {
          if (error?.status === 404) {
            // Removed catalog entries cannot accept progress. Do not block other videos.
            // Preserve a newer snapshot, cancelled request or changed viewer's data.
            if (!signal.aborted && currentAccount() === accountId && db.getItem(key) === value) db.removeItem(key);
            continue;
          }
          // Offline, timeout, throttling and auth failures retain the snapshot.
          break;
        }
        // An in-flight request must not erase a newer snapshot (or another tab's write).
        if (!signal.aborted && currentAccount() === accountId && db.getItem(key) === value) db.removeItem(key);
      }
    })().catch(() => {}).finally(() => { flight = null; controller = null; });
    return flight;
  };
  const cancel = () => controller?.abort();
  return { enqueue, flush, cancel };
}
