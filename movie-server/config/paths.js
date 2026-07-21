const path = require('path');

const ROOT = path.join(__dirname, '..');
const FRONTEND_DATA = path.join(ROOT, '..', 'my-movie', 'src');

module.exports = {
  ROOT,
  DATA_DIR: path.join(ROOT, 'data'),
  MOVIES_JSON: path.join(ROOT, 'data', 'movie.json'),
  ACTORS_JSON: path.join(ROOT, 'data', 'actors.json'),
  ACTOR_PAGE_LABELS_JSON: path.join(ROOT, 'data', 'actorPageLabels.json'),
  MUSIC_JSON: path.join(ROOT, 'data', 'music.json'),
  MUSIC_ALBUM_JSON: path.join(ROOT, 'data', 'musicAlbom.json'),
  KLIPS_JSON: path.join(ROOT, 'data', 'klips.json'),
  KONSERT_JSON: path.join(ROOT, 'data', 'konsert.json'),
  ARTIST_MUSIC_STORIES_JSON: path.join(ROOT, 'data', 'artistMusicStories.json'),
  BANNERS_JSON: path.join(ROOT, 'data', 'banners.json'),
  GENRES_JSON: path.join(ROOT, 'data', 'genres.json'),
  CATEGORIES_JSON: path.join(ROOT, 'data', 'categories.json'),
  ADS_JSON: path.join(ROOT, 'data', 'ads.json'),
  SHORTS_VIDEOS_JSON: path.join(ROOT, 'data', 'shortsVideos.json'),
  SOCIAL_LINKS_JSON: path.join(ROOT, 'data', 'socialLinks.json'),
  VIDEO_BANNERS_JSON: path.join(ROOT, 'data', 'videoBanners.json'),
  ARTISTS_JSON: path.join(ROOT, 'data', 'artists.json'),
  MUSIC_SHORTS_JSON: path.join(ROOT, 'data', 'musicShorts.json'),
  MUSIC_BANNERS_JSON: path.join(ROOT, 'data', 'musicBanners.json'),
  COMMENTS_JSON: path.join(ROOT, 'data', 'comments.json'),
  MOVIE_SECTIONS_JSON: path.join(ROOT, 'data', 'movieSections.json'),
  HOME_CONTENT_JSON: path.join(ROOT, 'data', 'homeContent.json'),
  MUSIC_SECTIONS_JSON: path.join(ROOT, 'data', 'musicSections.json'),
  MUSIC_PAGE_CONTENT_JSON: path.join(ROOT, 'data', 'musicPageContent.json'),
  CLIP_SECTIONS_JSON: path.join(ROOT, 'data', 'clipSections.json'),
  CONCERT_SECTIONS_JSON: path.join(ROOT, 'data', 'concertSections.json'),
};
