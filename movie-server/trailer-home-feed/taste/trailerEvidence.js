'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { validateProgressReport } = require('../progress/progressProtocol');
const { validateSignalAction, signalDay } = require('../signals/signalProtocol');
const { deriveSignalState } = require('../signals/deriveSignalState');
const { timestamp, decay } = require('./dimensions');

/** Input already belongs to ONE viewer; no browser-supplied dimensions or points are used. */
const collectTrailerEvidence = ({ catalog, sessions = [], actions = [], reactions = [], nowMs }) => {
  const config = trailerHomeFeedWeights;
  const policy = config.personalization;
  const cutoff = nowMs - policy.historyMaxAgeDays * 86400_000;
  const inWindow = (at) => at != null && at >= cutoff && at <= nowMs;
  const known = new Map(catalog.map((row) => [row.key, row]));
  const days = new Map();
  const seenSessions = new Map();
  const events = new Set();
  const evidence = new Map();
  const getEvidence = (key) => {
    if (!evidence.has(key)) evidence.set(key, { key, movieId: known.get(key).movieId, strengths: {}, meaningfulConfidence: 0, reaction: null });
    return evidence.get(key);
  };
  const getDay = (key, at) => {
    const id = JSON.stringify([key, signalDay(at)]);
    if (!days.has(id)) days.set(id, { key, at, sessions: [] });
    const day = days.get(id);
    day.at = Math.min(day.at, at);
    return day;
  };

  for (const raw of sessions) {
    const at = timestamp(raw?.createdAt ?? raw?.updatedAt);
    if (!inWindow(at) || (timestamp(raw?.updatedAt) ?? nowMs) > nowMs) continue;
    let session;
    try { session = validateProgressReport(raw); } catch { continue; }
    const key = `${session.movieId}-${session.trailerId}`;
    if (!known.has(key) || session.totalPlayedSeconds <= 0) continue;
    const identity = JSON.stringify([key, session.sessionId]);
    const previous = seenSessions.get(identity);
    if (!previous || session.totalPlayedSeconds > previous.session.totalPlayedSeconds) seenSessions.set(identity, { key, at, session });
  }
  for (const row of seenSessions.values()) getDay(row.key, row.at).sessions.push(row.session);

  for (const raw of actions) {
    const at = timestamp(raw?.occurredAt);
    if (!inWindow(at)) continue;
    let action;
    try { action = validateSignalAction(raw, config.engagement.impression); } catch { continue; }
    const key = `${action.movieId}-${action.trailerId}`;
    if (!known.has(key) || events.has(action.eventId)) continue;
    events.add(action.eventId);
    // An impression is exposure, never a personal preference.
    if (action.type === 'impression') continue;
    const item = getEvidence(key);
    const strength = config.engagement.weights[action.type] * decay(at, nowMs, policy.halfLifeDays);
    item.strengths[action.type] = Math.max(item.strengths[action.type] || 0, strength);
  }

  const cumulative = new Map();
  for (const day of [...days.values()].sort((a, b) => a.at - b.at)) {
    const state = deriveSignalState({ sessions: day.sessions });
    const item = getEvidence(day.key);
    const factor = decay(day.at, nowMs, policy.halfLifeDays);
    if (!cumulative.has(day.key)) cumulative.set(day.key, { sessions: [], milestones: new Set() });
    const history = cumulative.get(day.key);
    history.sessions.push(...day.sessions);
    const unionState = deriveSignalState({ sessions: history.sessions });
    for (const type of ['meaningfulWatch', 'completion', 'rewatch']) {
      item.strengths[type] = Math.max(item.strengths[type] || 0, state.contributions[type] * factor);
      // Partial watches on different days may first reach a milestone together.
      // Already-achieved milestones are never refreshed by a later tiny sample.
      if (unionState.flags[type] && !history.milestones.has(type)) {
        history.milestones.add(type);
        item.strengths[type] = Math.max(item.strengths[type], unionState.contributions[type] * factor);
        if (type === 'meaningfulWatch') item.meaningfulConfidence = Math.max(item.meaningfulConfidence, factor);
      }
    }
    if (state.flags.meaningfulWatch) item.meaningfulConfidence = Math.max(item.meaningfulConfidence, factor);
  }

  for (const raw of reactions) {
    const at = timestamp(raw?.updatedAt);
    if (!inWindow(at) || raw?.type !== 'movieTriller' || !known.has(raw.targetId) || !['like', 'dislike'].includes(raw.value)) continue;
    const item = getEvidence(raw.targetId);
    // Current canonical state is authoritative; defensive latest-wins if an injected reader duplicates rows.
    if (!item.reaction || item.reaction.at < at) item.reaction = { value: raw.value, at };
  }

  return [...evidence.values()].map((item) => {
    const disliked = item.reaction?.value === 'dislike';
    const strengths = { ...item.strengths };
    if (item.reaction?.value === 'like') strengths.like = config.engagement.weights.like * decay(item.reaction.at, nowMs, policy.halfLifeDays);
    return { ...item, strengths,
      positiveScore: disliked ? 0 : Math.min(config.engagement.maxPositiveScorePerViewerTrailerDay,
        Object.values(strengths).reduce((sum, value) => sum + value, 0)),
      excluded: disliked && nowMs - item.reaction.at <= config.repetition.dislikedCooldownDays * 86400_000,
    };
  });
};

module.exports = { collectTrailerEvidence };
