require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
try {
await prisma.achievement.findMany({ take: 1 });
console.log('DATABASE TEST PASSED');
} catch (error) {
console.log('DATABASE TEST FAILED');
console.log(error.message);
} finally {
await prisma.$disconnect();
}
}

testDatabase();