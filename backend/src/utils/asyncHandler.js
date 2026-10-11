// Express 4 does not catch errors thrown inside async functions.
// Wrapping a controller with asyncHandler forwards any error to next(),
// which sends it to the central error handler.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
