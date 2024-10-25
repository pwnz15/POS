const express = require('express');
const authController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validation');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');

const router = express.Router();

// Middleware to check if the user can create a superadmin
const canCreateSuperAdmin = (req, res, next) => {
  if (req.body.role === 'superadmin' && (!req.user || req.user.role !== 'superadmin')) {
    return next(new AppError('You do not have permission to create a superadmin account', 403));
  }
  next();
};

router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.get('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

router.use(authController.protect);

router.get('/me', authController.getMe);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', authController.updateMe);
router.delete('/deleteMe', authController.deleteMe);

module.exports = router;

