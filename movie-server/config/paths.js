const path = require('path');

const ROOT = path.join(__dirname, '..');
const FRONTEND_DATA = path.join(ROOT, '..', 'my-movie', 'src');

module.exports = {
  ROOT,
  DATA_DIR: path.join(ROOT, 'data'),
  MOVIES_JSON: path.join(ROOT, 'data', 'movie.json'),
  ACTORS_JSON: path.join(ROOT, 'data', 'actors.json'),
  MUSIC_JSON: path.join(ROOT, 'data', 'music.json'),
  MUSIC_ALBUM_JSON: path.join(ROOT, 'data', 'musicAlbom.json'),
  KLIPS_JSON: path.join(ROOT, 'data', 'klips.json'),
  KONSERT_JSON: path.join(ROOT, 'data', 'konsert.json'),
  ARTIST_MUSIC_STORIES_JSON: path.join(ROOT, 'data', 'artistMusicStories.json'),
  BANNERS_JSON: path.join(ROOT, 'data', 'banners.json'),
  COMMENTS_JSON: path.join(ROOT, 'data', 'comments.json'),
  MOVIE_SECTIONS_JSON: path.join(ROOT, 'data', 'movieSections.json'),
  HOME_CONTENT_JSON: path.join(ROOT, 'data', 'homeContent.json'),
  MUSIC_SECTIONS_JSON: path.join(ROOT, 'data', 'musicSections.json'),
  MUSIC_PAGE_CONTENT_JSON: path.join(ROOT, 'data', 'musicPageContent.json'),
  CLIP_SECTIONS_JSON: path.join(ROOT, 'data', 'clipSections.json'),
  CONCERT_SECTIONS_JSON: path.join(ROOT, 'data', 'concertSections.json'),
};
