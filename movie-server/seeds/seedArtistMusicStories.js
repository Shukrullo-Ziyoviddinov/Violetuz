require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const ArtistMusicStory = require('../models/ArtistMusicStory.model');
const { ARTIST_MUSIC_STORIES_JSON } = require('../config/paths');

const seedArtistMusicStories = async () => {
  const raw = fs.readFileSync(ARTIST_MUSIC_STORIES_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('artistMusicStories.json is empty or invalid');
  }

  await ArtistMusicStory.deleteMany({});

  let inserted = 0;

  for (const item of items) {
    const { id: _oldId, ...data } = item;
    if (data.artistId) {
      data.artistId = String(data.artistId).trim();
    }

    const story = new ArtistMusicStory(data);
    await story.save();
    inserted += 1;
  }

  const artists = [
    ...new Set(
      (await ArtistMusicStory.find({}, { artistId: 1 }).lean()).map((item) => item.artistId)
    ),
  ].sort();

  const idRange = await ArtistMusicStory.aggregate([
    { $group: { _id: null, minId: { $min: '$id' }, maxId: { $max: '$id' } } },
  ]);

  console.log(`Artist music stories seeded: ${inserted}`);
  console.log(`Auto ID range: ${idRange[0]?.minId} - ${idRange[0]?.maxId}`);
  console.log(`Artists: ${artists.join(', ')}`);

  return {
    total: inserted,
    artists,
    idRange: idRange[0] || null,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedArtistMusicStories();
    process.exit(0);
  } catch (error) {
    console.error('Artist music story seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedArtistMusicStories;
