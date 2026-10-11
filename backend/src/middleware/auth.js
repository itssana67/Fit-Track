// Protects private routes. Reads the JWT from the httpOnly cookie
// (or an "Authorization: Bearer <token>" header, handy for Postman),
// verifies it and attaches the logged-in user to req.user.
const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeUser = require('../utils/sanitizeUser');
const { COOKIE_NAME, verifyToken } = require('../utils/token');

const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  if (!token) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Your session has expired. Please log in again');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new ApiError(401, 'This account no longer exists');

  req.user = sanitizeUser(user);
  next();
});

module.exports = { protect };
