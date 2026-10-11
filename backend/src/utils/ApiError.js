// Custom error with an HTTP status code.
// Throw it anywhere in a controller; the central error handler formats it.
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status (400, 401, 404 ...)
   * @param {string} message   Human readable message for the UI
   * @param {object} [errors]  Optional per-field messages, e.g. { email: 'Email is required' }
   */
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isApiError = true;
  }
}

module.exports = ApiError;
