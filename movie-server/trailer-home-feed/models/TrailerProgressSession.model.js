'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  movieId: { type: Number, required: true },
  trailerId: { type: Number, required: true },
  sessionId: { type: String, required: true },
  durationSec: { type: Number, required: true },
  realWatchedSeconds: { type: Number, required: true, min: 0 },
  totalPlayedSeconds: { type: Number, required: true, min: 0 },
  intervals: { type: [[Number]], default: [] },
  version: { type: Number, default: 0 },
}, { collection: 'trailer_home_progress_sessions', timestamps: true, versionKey: false });

schema.index({ userId: 1, movieId: 1, trailerId: 1, sessionId: 1 }, { unique: true });
schema.index({ userId: 1, movieId: 1, trailerId: 1, updatedAt: -1 });
schema.index({ createdAt: 1 });

module.exports = mongoose.models.TrailerHomeProgressSession || mongoose.model('TrailerHomeProgressSession', schema);
