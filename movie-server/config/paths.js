const path = require('path');

const ROOT = path.join(__dirname, '..');
const FRONTEND_DATA = path.join(ROOT, '..', 'my-movie', 'src');

module.exports = {
  ROOT,
  DATA_DIR: path.join(ROOT, 'data'),
  MOVIES_JSON: path.join(FRONTEND_DATA, 'data', 'movie.json'),
  MUSIC_JSON: path.join(FRONTEND_DATA, 'dataMusic', 'music.json'),
  MUSIC_ALBUM_JSON: path.join(FRONTEND_DATA, 'dataMusic', 'musicAlbom.json'),
  KLIPS_JSON: path.join(FRONTEND_DATA, 'dataMusic', 'klips.json'),
  KONSERT_JSON: path.join(FRONTEND_DATA, 'dataMusic', 'konsert.json'),
  COMMENTS_JSON: path.join(ROOT, 'data', 'comments.json'),
  MOVIE_SECTIONS_JSON: path.join(ROOT, 'data', 'movieSections.json'),
  HOME_CONTENT_JSON: path.join(ROOT, 'data', 'homeContent.json'),
  MUSIC_SECTIONS_JSON: path.join(ROOT, 'data', 'musicSections.json'),
  MUSIC_PAGE_CONTENT_JSON: path.join(ROOT, 'data', 'musicPageContent.json'),
};
