require('dotenv').config();

const connectDB = require('../config/db');
const fingerprintService = require('../services/fingerprint/fingerprint.service');
const { checkFingerprintTools } = require('../services/fingerprint/fpcalcRunner');

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    all: args.includes('--all'),
    onlyMissing: !args.includes('--all'),
  };
};

const main = async () => {
  const tools = await checkFingerprintTools();
  if (!tools.fpcalc || !tools.ffmpeg) {
    console.error(
      'fpcalc va ffmpeg topilmadi. Docker ichida ishga tushiring yoki Windows ga o\'rnating.'
    );
    process.exit(1);
  }

  await connectDB();
  const { onlyMissing } = parseArgs();

  console.log(`Generating fingerprints (onlyMissing=${onlyMissing})...`);
  const summary = await fingerprintService.generateAllFingerprints({ onlyMissing });

  console.log('\n--- Summary ---');
  console.log(`Total: ${summary.total}`);
  console.log(`OK: ${summary.ok}`);
  console.log(`Failed: ${summary.failed.length}`);

  if (summary.failed.length) {
    summary.failed.forEach((f) => {
      console.log(`  id=${f.id} ${f.title}: ${f.error}`);
    });
  }

  process.exit(summary.failed.length ? 1 : 0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
