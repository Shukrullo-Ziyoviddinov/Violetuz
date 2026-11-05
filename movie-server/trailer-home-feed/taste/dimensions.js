'use strict';

const DIMENSIONS = ['genre', 'country', 'actor', 'genreCountry', 'genreActor'];
const tokens = (raw) => [...new Set((Array.isArray(raw) ? raw : [raw])
  .filter((value) => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)))
  .map((value) => String(value).trim()).filter(Boolean))];
const pairs = (left, right) => left.flatMap((a) => right.map((b) => JSON.stringify([a, b])));
const dimensionValues = (item) => {
  const genre = tokens(item.filterGenre);
  const country = tokens(item.filterCountry);
  const actor = tokens(item.actors);
  return { genre, country, actor, genreCountry: pairs(genre, country), genreActor: pairs(genre, actor) };
};
const emptyDimensions = () => Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, new Map()]));
const rankedDimensions = (maps) => Object.fromEntries(DIMENSIONS.map((dimension) => [dimension,
  [...maps[dimension]].map(([value, score]) => ({ value, score })).sort((a, b) => b.score - a.score || a.value.localeCompare(b.value))]));
const timestamp = (raw) => {
  if (!(raw instanceof Date) && typeof raw !== 'string' && typeof raw !== 'number') return null;
  const value = raw instanceof Date ? raw.getTime() : typeof raw === 'number' ? raw : Date.parse(raw);
  return Number.isFinite(value) ? value : null;
};
const decay = (at, nowMs, halfLifeDays) => 2 ** (-(nowMs - at) / (halfLifeDays * 86400_000));

module.exports = { DIMENSIONS, tokens, dimensionValues, emptyDimensions, rankedDimensions, timestamp, decay };
