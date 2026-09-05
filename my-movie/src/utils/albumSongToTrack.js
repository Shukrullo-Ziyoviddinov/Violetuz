/** Shared album song → player track mapper (single source of truth). */

export const ALBUM_TRACK_ID_OFFSET = 50000;

/**
 * @param {Object} album
 * @param {Object} song
 */
export function albumSongToTrack(album, song) {
  return {
    id: ALBUM_TRACK_ID_OFFSET + album.id * 100 + song.id,
    title: song.title,
    artist: song.artist,
    img: album.img,
    audio: song.audio,
    year: album.year,
    albumId: album.id,
    albumSongId: song.id,
    categoryNameMusic: album.categoryNameMusic,
    lyricsText: song.lyricsText,
  };
}
