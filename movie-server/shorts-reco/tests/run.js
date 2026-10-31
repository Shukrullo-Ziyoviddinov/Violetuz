'use strict';

const { spawnSync } = require('node:child_process');
const path = require('path');

const files = [
  'normalize.test.js',
  'keys.test.js',
  'profileRef.test.js',
  'profileHeat.repo.test.js',
  'profileHeat.test.js',
  'profileSignal.test.js',
  'profileSlice.test.js',
  'profileAttach.test.js',
  'profileVerify.test.js',
  'songLinks.test.js',
  'refs.test.js',
  'indexes.test.js',
  'catalogSync.test.js',
  'scoring.test.js',
  'profile.test.js',
  'actors.test.js',
  'watchEvent.test.js',
  'anchors.test.js',
  'eligibility.test.js',
  'slotPlan.test.js',
  'feedBuilder.test.js',
  'coldStart.test.js',
  'feedSession.test.js',
  'http.test.js',
  'shelf.test.js',
  'page.test.js',
  'liveWatch.test.js',
];

let failed = 0;

for (let i = 0; i < files.length; i += 1) {
  const file = path.join(__dirname, files[i]);
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit' });
  if (result.status !== 0) failed += 1;
}

if (failed > 0) {
  console.error(`${failed} test file(s) failed`);
  process.exit(1);
}

console.log('shorts-reco tests passed');
