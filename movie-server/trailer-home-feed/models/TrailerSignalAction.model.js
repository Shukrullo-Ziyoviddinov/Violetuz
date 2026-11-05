'use strict';
const mongoose = require('mongoose');
const { ACTION_TYPES, SURFACES } = require('../signals/signalProtocol');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  movieId: { type: Number, required: true },
  trailerId: { type: Number, required: true },
  eventId: { type: String, required: true },
  day: { type: String, required: true },
  type: { type: String, enum: ACTION_TYPES, required: true },
  surface: { type: String, enum: SURFACES, required: true },
  occurredAt: { type: Date, required: true },
  visibleMs: Number,
  visibleRatio: Number,
}, { collection: 'trailer_home_signal_actions', versionKey: false });
// A retry keeps its original event ID, including across midnight.
schema.index({ userId: 1, eventId: 1 }, { unique: true });
schema.index({ userId: 1, movieId: 1, trailerId: 1, day: 1, type: 1 });
schema.index({ day: 1, type: 1, movieId: 1, trailerId: 1 });
schema.index({ occurredAt: 1 });
schema.index({ type: 1, occurredAt: 1 });
// No TTL: deleting idempotency keys would make old retries look new.
module.exports = mongoose.models.TrailerHomeSignalAction || mongoose.model('TrailerHomeSignalAction', schema);
