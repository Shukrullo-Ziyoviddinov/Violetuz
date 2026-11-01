const { Router } = require('express');
const channelController = require('../controllers/channel.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { validateChannelIdParam } = require('../middleware/validators');

const router = Router();

router.get('/username-available', asyncHandler(channelController.checkUsername));
router.get('/:id', validateChannelIdParam, asyncHandler(channelController.getChannelById));
router.get('/', asyncHandler(channelController.getChannels));

module.exports = router;
