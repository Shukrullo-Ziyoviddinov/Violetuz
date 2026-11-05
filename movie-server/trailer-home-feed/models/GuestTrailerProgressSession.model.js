'use strict';
const mongoose = require('mongoose');

// Separate from accounts. userId is a server-derived anonymous hash, never a User ref.
const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  movieId: { type: Number, required: true },
  trailerId: { type: Number, required: true },
  sessionId: { type: String, required: true },
  durationSec: { type: Number, required: true },
  realWatchedSeconds: { type: Number, required: true, min: 0 },
  totalPlayedSeconds: { type: Number, required: true, min: 0 },
  intervals: { type: [[Number]], default: [] },
  version: { type: Number, default: 0 },
}, { collection: 'trailer_home_guest_progress_sessions', timestamps: true, versionKey: false });
schema.index({ userId: 1, movieId: 1, trailerId: 1, sessionId: 1 }, { unique: true });
schema.index({ createdAt: 1 });
// Retain idempotency longer than the six-hour ticket lifetime and seven-day trend window.
schema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 86400 });
module.exports = mongoose.models.GuestTrailerHomeProgressSession || mongoose.model('GuestTrailerHomeProgressSession', schema);
