/**
 * Variant D — migrate static catalog media to Cloudflare R2.
 *
 * Steps:
 *  1) Upload my-movie/public/{img,video,music}/* → R2 keys img/… video/… music/…
 *  2) Rewrite movie-server/data/*.json paths → ${R2_PUBLIC_URL}/img/…
 *  3) Rewrite MongoDB string fields the same way (SPA /music/routes untouched)
 *
 * Usage:
 *   node scripts/migrateMediaToR2.js --dry-run
 *   node scripts/migrateMediaToR2.js
 *   node scripts/migrateMediaToR2.js --skip-upload
 *   node scripts/migrateMediaToR2.js --skip-seeds --skip-db
 *
 * Requires R2_* env vars in .env (same as runtime).
 * File bytes go server → R2 only in this one-time migration script (not the app upload path).
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const { R2_PUBLIC_URL, R2_BUCKET_NAME } = require('../config/env');
const { putObject, isR2Configured } = require('../services/r2Service');
const { deepRewriteMediaPaths } = require('../utils/rewriteMediaPaths');
const { DATA_DIR } = require('../config/paths');

const PUBLIC_ROOT = path.join(__dirname, '..', '..', 'my-movie', 'public');
const MEDIA_DIRS = ['img', 'video', 'music'];

const SKIP_DB_COLLECTIONS = new Set([
  'users',
  'authotps',
  'system.indexes',
]);

const EXT_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
};

const parseArgs = (argv) => ({
  dryRun: argv.includes('--dry-run'),
  skipUpload: argv.includes('--skip-upload'),
  skipSeeds: argv.includes('--skip-seeds'),
  skipDb: argv.includes('--skip-db'),
});

const listMediaFiles = () => {
  const files = [];

  for (const dir of MEDIA_DIRS) {
    const absDir = path.join(PUBLIC_ROOT, dir);
    if (!fs.existsSync(absDir)) {
      console.warn(`Missing public folder: ${absDir}`);
      continue;
    }

    for (const name of fs.readdirSync(absDir)) {
      const abs = path.join(absDir, name);
      if (!fs.statSync(abs).isFile()) continue;
      files.push({
        abs,
        key: `${dir}/${name}`,
        relativePath: `/${dir}/${name}`,
      });
    }
  }

  return files;
};

const contentTypeFor = (filePath) =>
  EXT_MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

const uploadAll = async (files, { dryRun }) => {
  console.log(`\n[upload] ${files.length} files → bucket ${R2_BUCKET_NAME}`);
  let ok = 0;
  let failed = 0;

  for (const file of files) {
    const contentType = contentTypeFor(file.abs);
    if (dryRun) {
      console.log(`  dry-run PUT ${file.key} (${contentType})`);
      ok += 1;
      continue;
    }

    try {
      const body = fs.readFileSync(file.abs);
      await putObject({ key: file.key, body, contentType });
      ok += 1;
      console.log(`  uploaded ${file.key}`);
    } catch (err) {
      failed += 1;
      console.error(`  FAIL ${file.key}: ${err.message}`);
    }
  }

  console.log(`[upload] done ok=${ok} failed=${failed}`);
  return { ok, failed };
};

const rewriteSeedFiles = ({ dryRun }) => {
  console.log(`\n[seeds] rewrite under ${DATA_DIR}`);
  if (!R2_PUBLIC_URL) {
    throw new Error('R2_PUBLIC_URL is required to rewrite seeds');
  }

  const names = fs.readdirSync(DATA_DIR).filter((n) => n.endsWith('.json'));
  let filesTouched = 0;
  let stringsRewritten = 0;

  for (const name of names) {
    const filePath = path.join(DATA_DIR, name);
    const raw = fs.readFileSync(filePath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn(`  skip invalid JSON: ${name}`);
      continue;
    }

    const stats = { rewritten: 0 };
    const next = deepRewriteMediaPaths(parsed, R2_PUBLIC_URL, stats);
    if (stats.rewritten === 0) continue;

    filesTouched += 1;
    stringsRewritten += stats.rewritten;

    if (dryRun) {
      console.log(`  dry-run ${name}: ${stats.rewritten} strings`);
      continue;
    }

    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log(`  wrote ${name}: ${stats.rewritten} strings`);
  }

  console.log(`[seeds] files=${filesTouched} strings=${stringsRewritten}`);
  return { filesTouched, stringsRewritten };
};

const rewriteMongo = async ({ dryRun }) => {
  console.log('\n[db] rewrite media strings in MongoDB');
  if (!R2_PUBLIC_URL) {
    throw new Error('R2_PUBLIC_URL is required to rewrite MongoDB');
  }

  await connectDB();
  const collections = await mongoose.connection.db.collections();
  let docsUpdated = 0;
  let stringsRewritten = 0;

  for (const collection of collections) {
    const name = collection.collectionName;
    if (SKIP_DB_COLLECTIONS.has(name) || name.startsWith('system.')) {
      continue;
    }

    const docs = await collection.find({}).toArray();
    let colDocs = 0;
    let colStrings = 0;

    for (const doc of docs) {
      const stats = { rewritten: 0 };
      const next = deepRewriteMediaPaths(doc, R2_PUBLIC_URL, stats);
      if (stats.rewritten === 0) continue;

      colDocs += 1;
      colStrings += stats.rewritten;

      if (!dryRun) {
        const { _id, ...rest } = next;
        await collection.replaceOne({ _id }, { _id, ...rest });
      }
    }

    if (colDocs > 0) {
      console.log(
        `  ${dryRun ? 'dry-run ' : ''}${name}: docs=${colDocs} strings=${colStrings}`
      );
    }

    docsUpdated += colDocs;
    stringsRewritten += colStrings;
  }

  console.log(`[db] docs=${docsUpdated} strings=${stringsRewritten}`);
  return { docsUpdated, stringsRewritten };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  console.log('=== migrateMediaToR2 ===');
  console.log(`dryRun=${args.dryRun}`);
  console.log(`R2_PUBLIC_URL=${R2_PUBLIC_URL || '(missing)'}`);
  console.log(`public root=${PUBLIC_ROOT}`);

  if (!args.skipUpload || !args.dryRun) {
    // upload needs R2; dry-run upload listing does not strictly need credentials
  }

  if (!args.skipUpload && !args.dryRun && !isR2Configured()) {
    throw new Error(
      'R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT (or R2_ACCOUNT_ID), R2_BUCKET_NAME, R2_PUBLIC_URL'
    );
  }

  if ((!args.skipSeeds || !args.skipDb) && !R2_PUBLIC_URL) {
    throw new Error('R2_PUBLIC_URL is required for seed/DB rewrite');
  }

  const files = listMediaFiles();
  console.log(`Found ${files.length} local media files`);
  if (files.length > 0 && R2_PUBLIC_URL) {
    console.log(`Sample public URL: ${R2_PUBLIC_URL}/${files[0].key}`);
  }

  if (!args.skipUpload) {
    await uploadAll(files, args);
  } else {
    console.log('\n[upload] skipped');
  }

  if (!args.skipSeeds) {
    rewriteSeedFiles(args);
  } else {
    console.log('\n[seeds] skipped');
  }

  if (!args.skipDb) {
    await rewriteMongo(args);
  } else {
    console.log('\n[db] skipped');
  }

  console.log('\nDone.');
  console.log('Frontend field names unchanged — values are now absolute CDN URLs.');
  console.log('UI chrome still using /img/... from public/ keeps working locally.');
};

main()
  .then(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\nMigration failed:', err.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  });
