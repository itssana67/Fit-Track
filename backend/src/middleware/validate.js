// Middleware factory: validates req.body against rules before the controller runs.
// On success req.body is replaced with the cleaned values (unknown fields are dropped).
const ApiError = require('../utils/ApiError');
const { validateData } = require('../utils/validation');

const validateBody = (rules, options) => (req, res, next) => {
  const { errors, values, isValid } = validateData(req.body, rules, options);
  if (!isValid) {
    return next(new ApiError(400, 'Please fix the highlighted fields', errors));
  }
  req.body = values;
  next();
};

// Rejects ids that are not valid MongoDB ObjectIds (24 hex characters)
const validateObjectId = (...params) => (req, res, next) => {
  for (const param of params) {
    if (!/^[a-f\d]{24}$/i.test(req.params[param] || '')) {
      return next(new ApiError(400, `Invalid ${param}`));
    }
  }
  next();
};

module.exports = { validateBody, validateObjectId };
