const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');

/**
 * Auth routes — isolated from catalog APIs.
 * Base: /api/auth
 */
const router = Router();

router.get('/username-available', optionalAuth, authController.checkUsername);
router.post('/register/start', authController.registerStart);
router.post('/register/verify', authController.registerVerify);
router.post('/login/start', authController.loginStart);
router.post('/login/verify', authController.loginVerify);
router.post('/login/username', authController.loginUsername);
router.get('/me', optionalAuth, authController.me);
router.get('/device-accounts', optionalAuth, authController.listDeviceAccounts);
router.post('/switch', authController.switchAccount);
router.post('/logout', authController.logout);
router.patch('/profile', requireAuth, authController.updateProfile);

module.exports = router;
