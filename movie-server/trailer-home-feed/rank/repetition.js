'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { validateProgressReport } = require('../progress/progressProtocol');
const { validateSignalAction, signalDay } = require('../signals/signalProtocol');
const { deriveSignalState } = require('../signals/deriveSignalState');
const { timestamp } = require('../taste/dimensions');

/** ONE viewer's scoped/private history. This state never updates progress or reactions. */
const buildRepetitionState = ({ sessions = [], actions = [], reactions = [], nowMs = Date.now() } = {}) => {
  if (!Number.isFinite(nowMs)) throw new TypeError('Invalid repetition clock');
  const config = trailerHomeFeedWeights;
  const cutoff = nowMs - config.personalization.historyMaxAgeDays * 86400_000;
  const days = new Map();
  const sessionMap = new Map();
  for (const raw of sessions) {
    const at = timestamp(raw?.createdAt ?? raw?.updatedAt);
    if (at == null || at < cutoff || at > nowMs || (timestamp(raw?.updatedAt) ?? nowMs) > nowMs) continue;
    let session;
    try { session = validateProgressReport(raw); } catch { continue; }
    const key = `${session.movieId}-${session.trailerId}`;
    const id = JSON.stringify([key, session.sessionId]);
    const old = sessionMap.get(id);
    if (!old || session.totalPlayedSeconds > old.session.totalPlayedSeconds) sessionMap.set(id, { key, at, session });
  }
  for (const row of sessionMap.values()) {
    const id = JSON.stringify([row.key, signalDay(row.at)]);
    if (!days.has(id)) days.set(id, { key: row.key, at: row.at, sessions: [] });
    const group = days.get(id);
    group.at = Math.min(group.at, row.at);
    group.sessions.push(row.session);
  }
  const histories = new Map();
  const completionTimes = new Map();
  for (const day of [...days.values()].sort((a, b) => a.at - b.at)) {
    if (!histories.has(day.key)) histories.set(day.key, { sessions: [], completed: false });
    const history = histories.get(day.key);
    history.sessions.push(...day.sessions);
    const dailyComplete = deriveSignalState({ sessions: day.sessions }).flags.completion;
    const cumulativeComplete = deriveSignalState({ sessions: history.sessions }).flags.completion;
    if (dailyComplete || (cumulativeComplete && !history.completed)) completionTimes.set(day.key, day.at);
    history.completed = cumulativeComplete;
  }
  const hardExcluded = new Set();
  for (const [key, at] of completionTimes) if (nowMs - at < config.repetition.completedCooldownHours * 3600_000) hardExcluded.add(key);
  const latestReactions = new Map();
  for (const row of reactions) {
    const at = timestamp(row?.updatedAt);
    if (at == null || at > nowMs || row?.type !== 'movieTriller' || !/^\d+-\d+$/.test(row.targetId)
      || !['like', 'dislike'].includes(row.value)) continue;
    if (!latestReactions.has(row.targetId) || latestReactions.get(row.targetId).at < at) latestReactions.set(row.targetId, { value: row.value, at });
  }
  for (const [key, reaction] of latestReactions) {
    if (reaction.value === 'dislike' && nowMs - reaction.at < config.repetition.dislikedCooldownDays * 86400_000) hardExcluded.add(key);
  }
  const impressionCounts = new Map();
  const seenEvents = new Set();
  for (const row of actions) {
    const at = timestamp(row?.occurredAt);
    if (at == null || at > nowMs || nowMs - at >= config.repetition.impressionLookbackHours * 3600_000) continue;
    let action;
    try { action = validateSignalAction(row, config.engagement.impression); } catch { continue; }
    if (action.type !== 'impression' || seenEvents.has(action.eventId)) continue;
    seenEvents.add(action.eventId);
    const key = `${action.movieId}-${action.trailerId}`;
    impressionCounts.set(key, (impressionCounts.get(key) || 0) + 1);
  }
  return { hardExcludedKeys: [...hardExcluded].sort(),
    completed: [...completionTimes].map(([key, at]) => ({ key, completedAt: new Date(at).toISOString() })),
    impressions: [...impressionCounts].map(([key, count]) => ({ key, count })) };
};

module.exports = { buildRepetitionState };
