const { Router } = require('express');
const authController = require('../controllers/auth.controller');

/**
 * Auth routes — isolated from catalog APIs.
 * Base: /api/auth
 */
const router = Router();

router.get('/status', authController.status);
router.get('/username-available', authController.checkUsername);
router.post('/register/start', authController.registerStart);
router.post('/register/verify', authController.registerVerify);
router.post('/login/start', authController.loginStart);
router.post('/login/verify', authController.loginVerify);

module.exports = router;
