const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const logger = require('../utils/logger');
const { validateSignup, validateLogin } = require('../middleware/validation');
const promisify = require('util').promisify;

const signToken = (id, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign({ id }, secret, { expiresIn });
};

const createSendTokens = async (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = user.createRefreshToken();

  // Save the user to update the refreshTokens array in the database
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    expires: new Date(Date.now() + config.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, path: '/api/auth/refresh-token' });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: { user }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { error } = validateSignup(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { username, email, password, passwordConfirm, role } = req.body;
  logger.info(`Attempting to register user: ${email}`);

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    logger.warn(`Registration failed: Email or username already in use - ${email}`);
    return next(new AppError('Email or username already in use', 400));
  }

  const newUser = await User.create({
    username,
    email,
    password,
    passwordConfirm,
    role: role || 'user'
  });

  logger.info(`User registered successfully: ${newUser.email}`);
  await createSendTokens(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  logger.info(`Login attempt for user: ${email}`);

  // Check if email and password exist
  if (!email || !password) {
    logger.warn('Login failed: Email or password not provided');
    return next(new AppError('Please provide email and password!', 400));
  }

  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  logger.info(`User found: ${user ? 'Yes' : 'No'}`);

  if (!user) {
    logger.warn(`Login failed: User not found - ${email}`);
    return next(new AppError('Incorrect email or password', 401));
  }

  // Check if password is correct
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  logger.info(`Password correct: ${isPasswordCorrect ? 'Yes' : 'No'}`);

  if (!isPasswordCorrect) {
    logger.warn(`Login failed: Incorrect password - ${email}`);
    return next(new AppError('Incorrect email or password', 401));
  }

  // If everything is ok, send token to client
  logger.info(`User logged in successfully: ${user.email}`);
  await createSendTokens(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password, passwordConfirm } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return next(new AppError('Email or username already in use', 400));
  }

  const user = await User.create({ username, email, password, passwordConfirm });
  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
    user: {
      username: user.username,
      email: user.email
    }
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendTokens(user, 200, res);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
  }
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 400));
  }
  const decoded = await promisify(jwt.verify)(refreshToken, config.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    return next(new AppError('Invalid refresh token', 401));
  }
  user.removeRefreshToken(refreshToken);
  await createSendTokens(user, 200, res);
});

function filterObj(obj, ...allowedFields) {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}
