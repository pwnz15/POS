const AppError = require('../utils/appError');

exports.validatePosTransaction = (req, res, next) => {
  const { items, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Invalid or empty items array', 400));
  }

  if (!paymentMethod || !['cash', 'credit card', 'debit card'].includes(paymentMethod)) {
    return next(new AppError('Invalid payment method', 400));
  }

  next();
};
