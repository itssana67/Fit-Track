// A small, dependency-free validator.
// Each route describes its fields with "rules"; validateData() checks the
// request body against them and returns cleaned values + readable errors.
//
// Rule options:
//   type:     'string' | 'email' | 'password' | 'int' | 'number' | 'boolean' | 'date' | 'enum'
//   required: field must be present
//   min/max:  length for strings, value for numbers
//   values:   allowed values for 'enum'
//   default:  value used on create when the field is missing
//   label:    name shown in error messages
const { parseDateOnly } = require('./dates');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function checkRange(value, rule, label, unit = '') {
  if (rule.min !== undefined && value < rule.min) return `${label} must be at least ${rule.min}${unit}`;
  if (rule.max !== undefined && value > rule.max) return `${label} must be at most ${rule.max}${unit}`;
  return null;
}

function validateField(value, rule, label) {
  switch (rule.type) {
    case 'string': {
      const text = String(value).trim();
      if (rule.min !== undefined && text.length < rule.min) return { error: `${label} must be at least ${rule.min} characters` };
      if (rule.max !== undefined && text.length > rule.max) return { error: `${label} must be at most ${rule.max} characters` };
      return { value: text };
    }
    case 'email': {
      const email = String(value).trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) return { error: 'Enter a valid email address' };
      return { value: email };
    }
    case 'password': {
      const password = String(value);
      if (password.length < 8) return { error: 'Password must be at least 8 characters' };
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return { error: 'Password must contain at least one letter and one number' };
      }
      return { value: password };
    }
    case 'int': {
      const number = Number(value);
      if (!Number.isInteger(number)) return { error: `${label} must be a whole number` };
      const rangeError = checkRange(number, rule, label);
      return rangeError ? { error: rangeError } : { value: number };
    }
    case 'number': {
      const number = Number(value);
      if (!Number.isFinite(number)) return { error: `${label} must be a number` };
      const rangeError = checkRange(number, rule, label);
      return rangeError ? { error: rangeError } : { value: Math.round(number * 100) / 100 };
    }
    case 'boolean': {
      if (value === true || value === 'true') return { value: true };
      if (value === false || value === 'false') return { value: false };
      return { error: `${label} must be true or false` };
    }
    case 'date': {
      const date = parseDateOnly(value);
      if (!date) return { error: `${label} must be a valid date (YYYY-MM-DD)` };
      return { value: date };
    }
    case 'enum': {
      const option = String(value).toUpperCase();
      if (!rule.values.includes(option)) return { error: `${label} must be one of: ${rule.values.join(', ')}` };
      return { value: option };
    }
    default:
      return { value };
  }
}

/**
 * @param {object} data   request body
 * @param {object} rules  field rules
 * @param {object} options { partial: true } for updates - missing fields are skipped
 */
function validateData(data = {}, rules = {}, { partial = false } = {}) {
  const errors = {};
  const values = {};

  for (const [field, rule] of Object.entries(rules)) {
    const label = rule.label || field;
    const value = data[field];
    const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

    if (isEmpty) {
      if (rule.required) {
        // On partial updates a field that was simply not sent is fine
        if (!(partial && value === undefined)) errors[field] = `${label} is required`;
        continue;
      }
      if (value === undefined) {
        if (!partial && rule.default !== undefined) values[field] = rule.default;
        continue;
      }
      values[field] = null; // optional field explicitly cleared
      continue;
    }

    const result = validateField(value, rule, label);
    if (result.error) errors[field] = result.error;
    else values[field] = result.value;
  }

  return { errors, values, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validateData };
