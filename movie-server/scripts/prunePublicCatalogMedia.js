/**
 * Variant F — prune catalog media from my-movie/public after R2 migration.
 * Keeps UI chrome assets that are hardcoded in src (logos, empty states, flags).
 *
 *   node scripts/prunePublicCatalogMedia.js           # dry-run
 *   node scripts/prunePublicCatalogMedia.js --execute
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_ROOT = path.join(__dirname, '..', '..', 'my-movie', 'public');
const execute = process.argv.includes('--execute');

/** Hardcoded in my-movie/src — do not delete */
const KEEP_IMG = new Set([
  'movie1.jpg',
  'galichka.png',
  'galichka2.png',
  'uzb-by.jpg',
  'rubay.png',
  'newlogo_preview_rev_1.png',
  'vlvioletplay_preview_rev_1.png',
  'photo_2026-02-16_20-30-31_preview_rev_1.png',
  'photo_2026-02-19_21-28-29.jpg',
  'imdb.jpg',
  'imdbnew.png',
  'kinopoisk.jpg',
  'netflix.jpg',
  'netflixnew1.webp',
  'vlplay_preview_rev_1.png',
  'komentpustota_preview_rev_1.png',
  'messagiImg_preview_rev_1.png',
  'ReytingImg_preview_rev_1.png',
  'wishlist_preview_rev_1.png',
  'feedImg_preview_rev_2.png',
  'LikeHistoryImg_preview_rev_1.png',
  'auth-register-bg.jpg',
  'profilfoto.jpg',
]);

const KEEP_MUSIC = new Set([
  /* SPA chrome only if any; catalog mp3s go to R2 */
]);

const collectDeletions = () => {
  const toDelete = [];

  const imgDir = path.join(PUBLIC_ROOT, 'img');
  if (fs.existsSync(imgDir)) {
    for (const name of fs.readdirSync(imgDir)) {
      const abs = path.join(imgDir, name);
      if (!fs.statSync(abs).isFile()) continue;
      if (KEEP_IMG.has(name)) continue;
      toDelete.push(abs);
    }
  }

  const videoDir = path.join(PUBLIC_ROOT, 'video');
  if (fs.existsSync(videoDir)) {
    for (const name of fs.readdirSync(videoDir)) {
      const abs = path.join(videoDir, name);
      if (!fs.statSync(abs).isFile()) continue;
      toDelete.push(abs);
    }
  }

  const musicDir = path.join(PUBLIC_ROOT, 'music');
  if (fs.existsSync(musicDir)) {
    for (const name of fs.readdirSync(musicDir)) {
      const abs = path.join(musicDir, name);
      if (!fs.statSync(abs).isFile()) continue;
      if (KEEP_MUSIC.has(name)) continue;
      toDelete.push(abs);
    }
  }

  return toDelete;
};

const main = () => {
  const files = collectDeletions();
  let bytes = 0;
  for (const abs of files) {
    bytes += fs.statSync(abs).size;
  }

  console.log(`=== prunePublicCatalogMedia ===`);
  console.log(`mode: ${execute ? 'EXECUTE' : 'dry-run'}`);
  console.log(`candidates: ${files.length} files (~${(bytes / (1024 * 1024)).toFixed(1)} MB)`);
  console.log(`keeping ${KEEP_IMG.size} UI chrome images under public/img/`);

  if (!execute) {
    console.log('\nSample (first 15):');
    files.slice(0, 15).forEach((f) => console.log(`  ${path.relative(PUBLIC_ROOT, f)}`));
    console.log('\nRe-run with --execute to delete.');
    console.log('Run migrate:media-to-r2 first so Mongo/seed use CDN URLs.');
    return;
  }

  let deleted = 0;
  for (const abs of files) {
    fs.unlinkSync(abs);
    deleted += 1;
  }

  console.log(`Deleted ${deleted} files (~${(bytes / (1024 * 1024)).toFixed(1)} MB).`);
};

main();
