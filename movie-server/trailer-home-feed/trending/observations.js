'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { validateSignalAction, signalDay } = require('../signals/signalProtocol');
const { validateProgressReport } = require('../progress/progressProtocol');
const { deriveSignalState } = require('../signals/deriveSignalState');

const timeMs = (value) => {
  if (!(value instanceof Date) && typeof value !== 'string') return null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : null;
};
const viewerId = (value) => typeof value === 'string' && value.trim() ? value.trim()
  : typeof value?.toHexString === 'function' ? value.toHexString() : null;

/** Server-owned source rows only. Guest namespace is for a future verified ingestion reader. */
const buildTrendObservations = ({ catalog, actions = [], sessions = [], reactions = [], namespace = 'account', nowMs = Date.now() }) => {
  if (!['account', 'guest'].includes(namespace) || !Number.isFinite(nowMs)) throw new TypeError('Invalid trend source context');
  const config = trailerHomeFeedWeights;
  const fromMs = nowMs - config.trending.windowDays * 86400_000;
  const allowed = new Set(catalog.map((row) => row.key));
  const groups = new Map();
  const receipts = new Set();
  const reactionReceipts = new Set();
  const sessionReceipts = new Map();
  const inWindow = (time) => time != null && time >= fromMs && time <= nowMs;
  const getGroup = (viewer, key, at) => {
    const day = signalDay(at);
    const identity = JSON.stringify([viewer, key, day]);
    if (!groups.has(identity)) groups.set(identity, { viewerKey: `${namespace}:${viewer}`, key, day, at, actions: new Map(), sessions: new Map(), reaction: null });
    const group = groups.get(identity);
    group.at = Math.min(group.at, at); // Repeating an action cannot refresh its entire cohort.
    return group;
  };

  // Retried rows have one immutable event identity; only timestamped valid actions qualify.
  for (const row of [...actions].sort((a, b) => (timeMs(a?.occurredAt) ?? Infinity) - (timeMs(b?.occurredAt) ?? Infinity))) {
    const viewer = viewerId(row?.userId);
    const at = timeMs(row?.occurredAt);
    if (!viewer || !inWindow(at)) continue;
    let action;
    try { action = validateSignalAction(row, config.engagement.impression); } catch { continue; }
    const key = `${action.movieId}-${action.trailerId}`;
    const receipt = JSON.stringify([viewer, action.eventId]);
    if (!allowed.has(key) || receipts.has(receipt)) continue;
    receipts.add(receipt);
    getGroup(viewer, key, at).actions.set(action.type, action);
  }

  // createdAt is the first server receipt of the cumulative session, not updatedAt.
  for (const row of sessions) {
    const viewer = viewerId(row?.userId);
    const at = timeMs(row?.createdAt);
    const updatedAt = timeMs(row?.updatedAt);
    if (!viewer || !inWindow(at) || (updatedAt != null && updatedAt > nowMs)) continue;
    let session;
    try { session = validateProgressReport(row); } catch { continue; }
    const key = `${session.movieId}-${session.trailerId}`;
    if (!allowed.has(key) || session.totalPlayedSeconds <= 0) continue;
    const identity = JSON.stringify([viewer, key, session.sessionId]);
    const prior = sessionReceipts.get(identity);
    if (!prior || session.totalPlayedSeconds > prior.session.totalPlayedSeconds) sessionReceipts.set(identity, { viewer, key, at, session });
  }
  for (const { viewer, key, at, session } of sessionReceipts.values()) getGroup(viewer, key, at).sessions.set(session.sessionId, session);

  // Only current canonical reactions are read. Removed likes are absent; toggles do not add votes.
  for (const row of reactions) {
    const viewer = viewerId(row?.userId);
    const at = timeMs(row?.updatedAt);
    if (!viewer || row.type !== 'movieTriller' || !allowed.has(row.targetId) || !inWindow(at)
      || !['like', 'dislike'].includes(row.value)) continue;
    const identity = JSON.stringify([viewer, row.targetId]);
    if (reactionReceipts.has(identity)) continue;
    reactionReceipts.add(identity);
    getGroup(viewer, row.targetId, at).reaction = { value: row.value };
  }

  return [...groups.values()].map((group) => {
    const state = deriveSignalState({ actions: [...group.actions.values()], sessions: [...group.sessions.values()], reaction: group.reaction });
    return {
      key: group.key, viewerKey: group.viewerKey, day: group.day, occurredAt: new Date(group.at).toISOString(),
      impression: state.flags.impression, opened: state.flags.open,
      meaningfulWatch: state.flags.meaningfulWatch, coverage: state.lifetimeWatch.coverage,
      completed: state.flags.completion, liked: state.flags.like, disliked: state.flags.dislike,
      openedMovie: state.flags.openMovie,
    };
  });
};

module.exports = { buildTrendObservations };
