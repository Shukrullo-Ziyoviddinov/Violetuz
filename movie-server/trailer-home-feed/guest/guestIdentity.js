'use strict';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { badRequest } = require('../../utils/errors');
const { validateProgressReport } = require('../progress/progressProtocol');

const GUEST_COOKIE = 'violet_trailer_guest';
const createGuestIdentity = ({ secret, now = Date.now }) => {
  const sign = (payload, audience, seconds) => jwt.sign({ ...payload, iat: Math.floor(now() / 1000) }, secret,
    { algorithm: 'HS256', audience, expiresIn: seconds });
  const verify = (token, audience) => jwt.verify(token, secret,
    { algorithms: ['HS256'], audience, clockTimestamp: Math.floor(now() / 1000) });
  const read = (token) => {
    try {
      const payload = verify(token, 'trailer-guest-identity');
      if (!/^[a-f0-9]{64}$/.test(payload.sub)) return null;
      return crypto.createHash('sha256').update(`trailer-guest:${payload.sub}`).digest('hex');
    } catch { return null; }
  };
  const issue = () => {
    const token = sign({ sub: crypto.randomBytes(32).toString('hex') }, 'trailer-guest-identity', 180 * 86400);
    return { token, guestId: read(token) };
  };
  const start = (guestId, input) => {
    let report;
    try { report = validateProgressReport({ ...input, intervals: [], realWatchedSeconds: 0, totalPlayedSeconds: 0 }); }
    catch (error) { throw badRequest(error.message); }
    return sign({ guestId, movieId: report.movieId, trailerId: report.trailerId, sessionId: report.sessionId,
      durationSec: report.durationSec, startedAt: now() }, 'trailer-guest-playback', 6 * 3600);
  };
  const validate = (guestId, input) => {
    try {
      const ticket = verify(input?.ticket, 'trailer-guest-playback');
      const report = validateProgressReport(input);
      if (ticket.guestId !== guestId || ['movieId', 'trailerId', 'sessionId', 'durationSec'].some((key) => ticket[key] !== report[key])) {
        throw new TypeError('Guest playback identity changed');
      }
      if (report.realWatchedSeconds > (now() - ticket.startedAt) / 1000 + 2) throw new TypeError('Guest watch time exceeds session elapsed time');
      return report;
    } catch (error) { throw badRequest(error.message); }
  };
  return { read, issue, start, validate };
};
module.exports = { GUEST_COOKIE, createGuestIdentity };
