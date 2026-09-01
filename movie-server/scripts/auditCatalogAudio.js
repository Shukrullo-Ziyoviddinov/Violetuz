require('dotenv').config();
const connectDB = require('../config/db');
const Music = require('../models/Music.model');

(async () => {
  await connectDB();
  const rows = await Music.aggregate([
    { $match: { audio: { $ne: '' } } },
    {
      $group: {
        _id: '$audio',
        ids: { $push: '$id' },
        titles: { $addToSet: '$title' },
        count: { $sum: 1 },
      },
    },
  ]);
  for (const r of rows) {
    console.log(JSON.stringify({ audio: r._id, count: r.count, sampleTitles: r.titles.slice(0, 4) }));
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
