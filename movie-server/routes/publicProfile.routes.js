const { Router } = require('express');
const publicProfileController = require('../controllers/publicProfile.controller');

/**
 * Ochiq profil o‘qish. Login shart emas.
 * Base: /api/users
 */
const router = Router();

router.get('/:id', publicProfileController.getPublicProfile);

module.exports = router;
