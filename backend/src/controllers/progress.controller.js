const prisma = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeUser = require('../utils/sanitizeUser');
const { syncUserWeight } = require('../services/stats.service');

async function findOwnEntry(id, userId) {
  const entry = await prisma.progress.findFirst({ where: { id, userId } });
  if (!entry) throw new ApiError(404, 'Progress entry not found');
  return entry;
}

// GET /api/progress  (oldest first, which is the order charts need)
const getProgress = asyncHandler(async (req, res) => {
  const entries = await prisma.progress.findMany({
    where: { userId: req.user.id },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });
  res.json({ entries });
});

// POST /api/progress
const createProgress = asyncHandler(async (req, res) => {
  const entry = await prisma.progress.create({ data: { ...req.body, userId: req.user.id } });
  const user = await syncUserWeight(req.user.id);
  res.status(201).json({ message: 'Progress saved', entry, user: sanitizeUser(user) });
});

// PUT /api/progress/:id
const updateProgress = asyncHandler(async (req, res) => {
  const existing = await findOwnEntry(req.params.id, req.user.id);
  const entry = await prisma.progress.update({ where: { id: existing.id }, data: req.body });
  const user = await syncUserWeight(req.user.id);
  res.json({ message: 'Progress updated', entry, user: sanitizeUser(user) });
});

// DELETE /api/progress/:id
const deleteProgress = asyncHandler(async (req, res) => {
  const existing = await findOwnEntry(req.params.id, req.user.id);
  const count = await prisma.progress.count({ where: { userId: req.user.id } });
  if (count <= 1) {
    throw new ApiError(400, 'Keep at least one entry. Edit it instead of deleting it');
  }
  await prisma.progress.delete({ where: { id: existing.id } });
  const user = await syncUserWeight(req.user.id);
  res.json({ message: 'Progress entry deleted', id: existing.id, user: sanitizeUser(user) });
});

module.exports = { getProgress, createProgress, updateProgress, deleteProgress };
