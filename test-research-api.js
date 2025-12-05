/**
 * Quick test script for Research Paper API
 * Run this to verify the repository is working correctly
 */

const { researchPaperConfigRepository } = require('./src/dal/repositories/research-paper.repository');

async function testRepository() {
  console.log('🧪 Testing Research Paper Config Repository...\n');

  try {
    // Test 1: Find All Configs
    console.log('Test 1: Finding all configurations...');
    const allConfigs = await researchPaperConfigRepository.findAll();
    console.log(`✅ Found ${allConfigs.length} configurations`);
    console.log('Sample:', JSON.stringify(allConfigs[0], null, 2));
    console.log('');

    // Test 2: Find by Currency
    console.log('Test 2: Finding USD configurations...');
    const usdConfigs = await researchPaperConfigRepository.findByCurrency('USD');
    console.log(`✅ Found ${usdConfigs.length} USD configurations`);
    console.log('');

    // Test 3: Find Specific Config
    console.log('Test 3: Finding INR with 0 co-authors...');
    const specificConfig = await researchPaperConfigRepository.findByCurrencyAndCoAuthors('INR', 0);
    console.log('✅ Found:', JSON.stringify(specificConfig, null, 2));
    console.log('');

    console.log('🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRepository();
