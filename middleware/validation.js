const Joi = require('joi');
const AppError = require('../utils/appError');

const signupSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required(),
  passwordConfirm: Joi.ref('password'),
  role: Joi.string().valid('user', 'admin', 'superadmin', 'manager', 'supervisor', 'cashier', 'accountant', 'guest')
}).with('password', 'passwordConfirm');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const articleSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().positive().required(),
  codeABar: Joi.string().required(),
  // Add other fields as necessary
});

const validateSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return next(new AppError(errorMessage, 400));
  }
  req.body = value;
  next();
};

exports.validateArticle = (req, res, next) => {
  const schema = Joi.object({
    code: Joi.string().required(),
    designation: Joi.string().required(),
    stock: Joi.number().integer().min(0).required(),
    prixAchatHT: Joi.number().min(0).required(),
    pventeTTC: Joi.number().min(0).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  next();
};

module.exports = {
  validateSignup: validateSchema(signupSchema),
  validateLogin: validateSchema(loginSchema),
  validateArticle: validateSchema(articleSchema),
  // Add other validation functions as needed
};
