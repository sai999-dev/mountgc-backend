// Run this locally to test if the Prisma queries work
// Command: node test-query.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQueries() {
  try {
    console.log('🧪 Testing Prisma queries...\n');

    // Test 1: Query research paper purchases WITHOUT user relation
    console.log('Test 1: Research paper purchases (no relations)');
    const researchPurchasesSimple = await prisma.researchPaperPurchase.findMany({
      take: 3,
      orderBy: { created_at: 'desc' }
    });
    console.log(`✅ Found ${researchPurchasesSimple.length} research paper purchases`);
    if (researchPurchasesSimple.length > 0) {
      console.log('   Sample:', researchPurchasesSimple[0]);
    }
    console.log('');

    // Test 2: Query research paper purchases WITH user relation
    console.log('Test 2: Research paper purchases (with user relation)');
    const researchPurchasesWithUser = await prisma.researchPaperPurchase.findMany({
      take: 3,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    console.log(`✅ Found ${researchPurchasesWithUser.length} research paper purchases with user data`);
    if (researchPurchasesWithUser.length > 0) {
      console.log('   Sample:', researchPurchasesWithUser[0]);
    }
    console.log('');

    // Test 3: Query visa application purchases WITHOUT user relation
    console.log('Test 3: Visa application purchases (no relations)');
    const visaPurchasesSimple = await prisma.visaApplicationPurchase.findMany({
      take: 3,
      orderBy: { created_at: 'desc' }
    });
    console.log(`✅ Found ${visaPurchasesSimple.length} visa application purchases`);
    if (visaPurchasesSimple.length > 0) {
      console.log('   Sample:', visaPurchasesSimple[0]);
    }
    console.log('');

    // Test 4: Query visa application purchases WITH user relation
    console.log('Test 4: Visa application purchases (with user relation)');
    const visaPurchasesWithUser = await prisma.visaApplicationPurchase.findMany({
      take: 3,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    console.log(`✅ Found ${visaPurchasesWithUser.length} visa application purchases with user data`);
    if (visaPurchasesWithUser.length > 0) {
      console.log('   Sample:', visaPurchasesWithUser[0]);
    }
    console.log('');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();
