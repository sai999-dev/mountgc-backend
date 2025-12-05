const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetSession() {
  const result = await prisma.deviceSession.update({
    where: { session_id: 1 },
    data: { is_active: true, logout_at: null }
  });
  console.log('✅ Session reset to active');
  await prisma.$disconnect();
}

resetSession();
