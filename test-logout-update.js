const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogoutUpdate() {
  try {
    console.log('🧪 Testing logout update...\n');

    // Find all active sessions
    const activeSessions = await prisma.deviceSession.findMany({
      where: { is_active: true },
      select: {
        session_id: true,
        user_id: true,
        is_active: true,
        logout_at: true,
        login_at: true
      }
    });

    console.log(`📋 Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach(s => {
      console.log(`  - Session ${s.session_id} (User ${s.user_id}): is_active=${s.is_active}, logout_at=${s.logout_at}`);
    });

    if (activeSessions.length > 0) {
      const testSession = activeSessions[0];
      console.log(`\n🔧 Testing update on session ${testSession.session_id}...`);

      // Update the session
      const updated = await prisma.deviceSession.update({
        where: { session_id: testSession.session_id },
        data: {
          is_active: false,
          logout_at: new Date()
        }
      });

      console.log(`\n✅ Update result:`);
      console.log(`  - session_id: ${updated.session_id}`);
      console.log(`  - is_active: ${updated.is_active}`);
      console.log(`  - logout_at: ${updated.logout_at}`);
      console.log(`  - login_at: ${updated.login_at}`);

      // Verify the update
      const verified = await prisma.deviceSession.findUnique({
        where: { session_id: testSession.session_id }
      });

      console.log(`\n🔍 Verification from database:`);
      console.log(`  - is_active: ${verified.is_active}`);
      console.log(`  - logout_at: ${verified.logout_at}`);

      if (verified.is_active === false && verified.logout_at !== null) {
        console.log(`\n✅ SUCCESS: Database update is working correctly!`);
      } else {
        console.log(`\n❌ FAILED: Database update did not work!`);
      }
    } else {
      console.log('\n⚠️  No active sessions found to test. Please login first.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogoutUpdate();
