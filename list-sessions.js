const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listSessions() {
  const sessions = await prisma.deviceSession.findMany({
    orderBy: { session_id: 'desc' }
  });

  console.log('\n📋 All Device Sessions:\n');
  sessions.forEach(s => {
    console.log(`Session ${s.session_id}:`);
    console.log(`  User: ${s.user_id}`);
    console.log(`  Active: ${s.is_active}`);
    console.log(`  Login: ${s.login_at}`);
    console.log(`  Logout: ${s.logout_at || 'null'}`);
    console.log(`  Device: ${s.device_name}`);
    console.log('');
  });

  await prisma.$disconnect();
}

listSessions();
