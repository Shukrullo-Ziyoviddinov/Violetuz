const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

/**
 * Auth routes — isolated from catalog APIs.
 * Base: /api/auth
 */
const router = Router();

router.get('/username-available', authController.checkUsername);
router.post('/register/start', authController.registerStart);
router.post('/register/verify', authController.registerVerify);
router.post('/login/start', authController.loginStart);
router.post('/login/verify', authController.loginVerify);
router.post('/login/username', authController.loginUsername);
router.get('/me', optionalAuth, authController.me);
router.post('/logout', authController.logout);

module.exports = router;
