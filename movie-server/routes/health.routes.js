const { Router } = require('express');
const { sendSuccess } = require('../utils/response');

const router = Router();

router.get('/', (req, res) => {
  sendSuccess(res, {
    data: {
      status: 'ok',
      service: 'movie-server',
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
