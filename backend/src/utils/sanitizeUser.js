// Removes the password hash before a user object is sent to the client.
function sanitizeUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
}

module.exports = sanitizeUser;
