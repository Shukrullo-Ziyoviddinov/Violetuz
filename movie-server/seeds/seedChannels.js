require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const Channel = require('../models/Channel.model');
const Movie = require('../models/Movie.model');
const { CHANNELS_JSON } = require('../config/paths');
const {
  normalizeUsername,
  assertUsernameFormat,
  userHoldsUsername,
} = require('../services/channelUsername');

const seedChannels = async () => {
  const raw = fs.readFileSync(CHANNELS_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('channels.json is empty or invalid');
  }

  await Channel.deleteMany({});

  let inserted = 0;
  const seenUsernames = new Set();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const username = normalizeUsername(item.username);
    assertUsernameFormat(username);
    const usernameNormalized = username.toLowerCase();

    if (seenUsernames.has(usernameNormalized)) {
      throw new Error(`Duplicate channel username: ${username}`);
    }
    seenUsernames.add(usernameNormalized);

    if (await userHoldsUsername(usernameNormalized)) {
      throw new Error(`Channel username taken by a user: ${username}`);
    }

    const channel = new Channel({
      ...item,
      id: String(item.id).trim(),
      name: String(item.name || '').trim(),
      username,
      avatar: String(item.avatar || '').trim(),
      sortOrder: index + 1,
    });
    await channel.save();
    inserted += 1;
  }

  const ids = (await Channel.find({}, { id: 1 }).sort({ sortOrder: 1 }).lean()).map((item) => item.id);
  const violetPlayId = ids[0];
  const movieUpdate = violetPlayId
    ? await Movie.updateMany({}, { $set: { channelId: violetPlayId } })
    : { modifiedCount: 0, matchedCount: 0 };

  console.log(`Channels seeded: ${inserted}`);
  console.log(`Ids: ${ids.join(', ')}`);
  console.log(`Movies linked: ${movieUpdate.modifiedCount ?? movieUpdate.nModified ?? 0}`);

  return {
    total: inserted,
    ids,
    moviesLinked: movieUpdate.modifiedCount ?? movieUpdate.nModified ?? 0,
  };
};

const run = async () => {
  try {
    await connectDB();
    await seedChannels();
    process.exit(0);
  } catch (error) {
    console.error('Channel seed failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedChannels;
