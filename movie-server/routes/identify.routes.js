const multer = require('multer');
const { Router } = require('express');
const identifyController = require('../controllers/identify.controller');
const asyncHandler = require('../middleware/asyncHandler');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'video/webm' ||
      file.mimetype === 'application/octet-stream';
    if (ok) cb(null, true);
    else cb(new Error('Faqat audio fayl qabul qilinadi'));
  },
});

const router = Router();

/**
 * POST /identify/music
 * multipart field: audio
 */
router.post(
  '/music',
  upload.single('audio'),
  asyncHandler(identifyController.identifyMusic)
);

module.exports = router;
