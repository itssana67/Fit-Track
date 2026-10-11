// A single shared Prisma Client instance for the whole app.
// Prisma opens a connection pool to MongoDB using DATABASE_URL from .env.
// Re-using one instance avoids opening many pools when nodemon restarts.
const { PrismaClient } = require('@prisma/client');

const prisma =
  global.__fittrackPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__fittrackPrisma = prisma;
}

module.exports = prisma;
