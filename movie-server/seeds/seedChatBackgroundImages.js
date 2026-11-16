require('dotenv').config();

const fs = require('fs');

const connectDB = require('../config/db');
const ChatBackgroundImage = require('../message/models/ChatBackgroundImage.model');
const { CHAT_BACKGROUND_IMG_JSON } = require('../config/paths');

const seedChatBackgroundImages = async () => {
  const raw = fs.readFileSync(CHAT_BACKGROUND_IMG_JSON, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('chatBackroundImg.json is empty or invalid');
  }

  const defaults = items.filter((item) => item.isDefault === true);
  if (defaults.length !== 1) {
    throw new Error('chatBackroundImg.json must have exactly one default image');
  }

  await ChatBackgroundImage.deleteMany({});

  let inserted = 0;
  for (const item of items) {
    const row = new ChatBackgroundImage({
      id: Number(item.id),
      image: String(item.image || '').trim(),
      isDefault: item.isDefault === true,
      order: Number(item.order),
    });
    await row.save();
    inserted += 1;
  }

  const fallback = await ChatBackgroundImage.findOne({ isDefault: true }).select('id image').lean();
  console.log(`Chat background images seeded: ${inserted}`);
  console.log(`Default id: ${fallback?.id}`);

  return { total: inserted, defaultId: fallback?.id || null };
};

const run = async () => {
  try {
    await connectDB();
    await seedChatBackgroundImages();
    process.exit(0);
  } catch (error) {
    console.error('Chat background image seed failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedChatBackgroundImages;
