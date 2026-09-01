const fingerprintService = require('../services/fingerprint/fingerprint.service');
const { sendSuccess } = require('../utils/response');

const identifyMusic = async (req, res) => {
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ success: false, message: 'Audio fayl kerak' });
  }

  const result = await fingerprintService.identifyFromAudioBuffer(
    req.file.buffer,
    req.file.originalname || 'sample.webm'
  );

  sendSuccess(res, {
    count: result.matches.length,
    data: result.matches,
    meta: {
      queryDuration: result.queryDuration,
      bestScore: result.bestScore,
      scoreGap: result.scoreGap,
      meanVolumeDb: result.meanVolumeDb,
      rejectedReason: result.rejectedReason,
      threshold: fingerprintService.MATCH_THRESHOLD,
    },
  });
};

module.exports = {
  identifyMusic,
};
