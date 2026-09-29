/**
 * Guest mix assemble — local play counts → tayyor mixlar.
 * Server mixEngine.assembleMixes + getMixes listReadyMixes shakli bilan bir xil:
 *   minPlays 3, minMixSize 4, mixSize 25, music|klip alohida guruh.
 * DB / API yo‘q — faqat violet_guest_music_mix_plays_v1.
 */

import { musicMixWeights } from './musicMixWeights';
import { getMixPlayCounts } from '../localStorage/guestHistory/musicMixGuestPlayCounts';

const normalizeContentType = (value) => {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (raw === 'clip' || raw === 'klip') return 'klip';
  if (raw === 'music') return 'music';
  return '';
};

const resolveMixGenre = (genre) => {
  const name = String(genre || '').trim();
  if (name) return name;
  return String(musicMixWeights.unknownGenre || 'Boshqa').trim() || 'Boshqa';
};

/**
 * @param {{ playCount?: number, lastPlayedAt?: Date|string|number|null, contentId?: string }} a
 * @param {{ playCount?: number, lastPlayedAt?: Date|string|number|null, contentId?: string }} b
 */
const byMostPlayed = (a, b) => {
  const countDiff = (Number(b.playCount) || 0) - (Number(a.playCount) || 0);
  if (countDiff !== 0) return countDiff;
  const aTime = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
  const bTime = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
  if (bTime !== aTime) return bTime - aTime;
  return String(a.contentId).localeCompare(String(b.contentId));
};

/**
 * Server mixEngine.assembleMixes bilan bir xil.
 * @param {Array<{ contentId: string, genre: string, playCount: number, lastPlayedAt?: Date|string|number|null }>} rows
 * @param {'music'|'klip'} contentType
 * @returns {Array<{ genre: string, contentType: string, tracks: Array<{ contentId: string, genre: string, playCount: number, position: number }> }>}
 */
export const assembleMixes = (rows, contentType = 'music') => {
  const type = normalizeContentType(contentType) || 'music';
  const minPlays = Math.max(1, Number(musicMixWeights.minPlays) || 3);
  const minMixSize = Math.max(1, Number(musicMixWeights.minMixSize) || 4);
  const mixSize = Math.max(1, Number(musicMixWeights.mixSize) || 25);
  /** @type {Map<string, Object[]>} */
  const groups = new Map();

  for (const row of rows || []) {
    const playCount = Number(row.playCount) || 0;
    if (playCount < minPlays) continue;
    const genre = resolveMixGenre(row.genre);
    const contentId = String(row.contentId || '').trim();
    if (!genre || !contentId) continue;
    if (!groups.has(genre)) groups.set(genre, []);
    groups.get(genre).push({
      contentId,
      genre,
      playCount,
      lastPlayedAt: row.lastPlayedAt || null,
    });
  }

  /** @type {Array<{ genre: string, contentType: string, tracks: Object[] }>} */
  const mixes = [];
  for (const [genre, tracks] of groups) {
    if (tracks.length < minMixSize) continue;
    tracks.sort(byMostPlayed);
    const kept = tracks.slice(0, mixSize);
    if (kept.length < minMixSize) continue;
    mixes.push({
      genre,
      contentType: type,
      tracks: kept.map((track, index) => ({
        contentId: track.contentId,
        genre,
        playCount: track.playCount,
        position: index + 1,
      })),
    });
  }

  mixes.sort((a, b) => byMostPlayed(a.tracks[0], b.tracks[0]) || a.genre.localeCompare(b.genre));
  return mixes;
};

/**
 * Compact local rows → assemble input.
 * @param {Array<{ ct: string, m: string, g: string, p: number, t: number }>} entries
 */
const toPlayRows = (entries) =>
  (entries || [])
    .map((entry) => {
      const contentType = normalizeContentType(entry?.ct);
      const contentId = entry?.m == null ? '' : String(entry.m).trim();
      if (!contentType || !contentId) return null;
      return {
        contentType,
        contentId,
        genre: resolveMixGenre(entry?.g),
        playCount: Number(entry?.p) || 0,
        lastPlayedAt: Number.isFinite(Number(entry?.t)) ? Number(entry.t) : null,
      };
    })
    .filter(Boolean);

/**
 * Local ledgerdan barcha guest mixlar (music + klip).
 * Shakl: GET /music/mixes dagi mixes bilan bir xil.
 */
export const buildGuestMixes = (entries = getMixPlayCounts()) => {
  const rows = toPlayRows(entries);
  const music = assembleMixes(
    rows.filter((row) => row.contentType === 'music'),
    'music'
  );
  const klip = assembleMixes(
    rows.filter((row) => row.contentType === 'klip'),
    'klip'
  );

  const mixes = [...music, ...klip];
  mixes.sort((a, b) => {
    const countDiff = (b.tracks[0]?.playCount || 0) - (a.tracks[0]?.playCount || 0);
    if (countDiff !== 0) return countDiff;
    const typeDiff = String(a.contentType).localeCompare(String(b.contentType));
    if (typeDiff !== 0) return typeDiff;
    return a.genre.localeCompare(b.genre);
  });
  return mixes;
};

/** Qulay alias — UI keyin shuni chaqiradi. */
export const getGuestMixes = () => buildGuestMixes();
