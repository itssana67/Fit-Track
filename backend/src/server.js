// Entry point: connects to MongoDB through Prisma, then starts the HTTP server.
const env = require('./lib/env'); // must be first: loads .env
const app = require('./app');
const prisma = require('./lib/prisma');
const { syncAchievementDefinitions } = require('./services/achievement.service');

async function start() {
  try {
    await prisma.$connect();
    console.log('[FitTrack] Connected to MongoDB via Prisma');

    await syncAchievementDefinitions();

    app.listen(env.port, () => {
      console.log(`[FitTrack] API listening on http://localhost:${env.port}/api`);
      console.log(`[FitTrack] Allowed frontend origin(s): ${env.clientUrls.join(', ')}`);
      console.log(
        `[FitTrack] Exercise library source: ${env.exerciseApiKey ? 'API Ninjas (external API)' : 'built-in catalogue'}`
      );
    });
  } catch (err) {
    console.error('[FitTrack] Failed to start:', err.message);
    console.error('Check DATABASE_URL in backend/.env and that MongoDB is reachable.');
    process.exit(1);
  }
}

// Close the database connection cleanly on Ctrl+C
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
