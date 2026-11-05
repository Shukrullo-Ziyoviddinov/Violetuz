'use strict';
const { sourceTypes, trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');

const sourceSharesForProfile = (profile) => {
  const anchors = trailerHomeFeedWeights.personalization.confidenceAnchors;
  const last = anchors[anchors.length - 1];
  const direct = Number.isFinite(profile?.effectiveMeaningfulTrailers) ? Math.max(0, profile.effectiveMeaningfulTrailers) : 0;
  // A confidence-controlled movie prior may bootstrap an established movie viewer.
  const combined = Number.isFinite(profile?.confidence?.combined) ? Math.min(1, Math.max(0, profile.confidence.combined)) * last.count : 0;
  const experience = Math.min(last.count, Math.max(direct, combined));
  const right = anchors.find((anchor) => anchor.count >= experience) || last;
  const rightIndex = anchors.indexOf(right);
  const left = anchors[Math.max(0, rightIndex - 1)];
  const fraction = right.count === left.count ? 0 : (experience - left.count) / (right.count - left.count);
  const shares = Object.fromEntries(sourceTypes.map((source) => [source, left.shares[source] + fraction * (right.shares[source] - left.shares[source])]));
  return { experience, shares };
};

const availableShares = (shares, available) => {
  const active = sourceTypes.filter((source) => available[source]);
  const total = active.reduce((sum, source) => sum + shares[source], 0);
  return Object.fromEntries(sourceTypes.map((source) => [source, !available[source] ? 0
    : total > 0 ? shares[source] / total : 1 / active.length]));
};

module.exports = { sourceSharesForProfile, availableShares };
