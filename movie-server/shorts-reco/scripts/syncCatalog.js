'use strict';

/**
 * Manual full rebuild of reco_short_catalog and reco_song_links.
 * Reads existing collections only. Run from the repo with movie-server dependencies:
 *   node movie-server/shorts-reco/scripts/syncCatalog.js
 */

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const { createShortsRecoModule } = require('../index');

const main = async () => {
  await connectDB();
  const reco = createShortsRecoModule({
    connection: mongoose.connection,
    logger: console,
  });
  await reco.ensureIndexes();
  const result = await reco.runCatalogSync();
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch (_disconnectError) {
    // The original sync error is the one that should fail the process.
  }
  process.exit(1);
});
