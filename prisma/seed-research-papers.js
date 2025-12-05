const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedResearchPaperConfigs() {
  console.log('Seeding research paper configurations...');

  const configs = [
    // INR Pricing
    { currency: 'INR', co_authors: 0, actual_price: 79744, discounted_price: 63795.28, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'INR', co_authors: 1, actual_price: 89744, discounted_price: 71795.28, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'INR', co_authors: 2, actual_price: 99744, discounted_price: 79795.28, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'INR', co_authors: 3, actual_price: 109744, discounted_price: 87795.28, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    
    // USD Pricing
    { currency: 'USD', co_authors: 0, actual_price: 950, discounted_price: 760, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'USD', co_authors: 1, actual_price: 1070, discounted_price: 856, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'USD', co_authors: 2, actual_price: 1190, discounted_price: 952, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'USD', co_authors: 3, actual_price: 1310, discounted_price: 1048, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    
    // EUR Pricing
    { currency: 'EUR', co_authors: 0, actual_price: 890, discounted_price: 712, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'EUR', co_authors: 1, actual_price: 1000, discounted_price: 800, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'EUR', co_authors: 2, actual_price: 1110, discounted_price: 888, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
    { currency: 'EUR', co_authors: 3, actual_price: 1220, discounted_price: 976, discount_percent: 20.0, duration_weeks: '3-4 weeks' },
  ];

  for (const config of configs) {
    await prisma.researchPaperConfig.upsert({
      where: {
        currency_co_authors: {
          currency: config.currency,
          co_authors: config.co_authors
        }
      },
      update: config,
      create: config
    });
  }

  console.log('✅ Research paper configurations seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  seedResearchPaperConfigs()
    .then(() => {
      console.log('Seeding completed!');
      prisma.$disconnect();
    })
    .catch((error) => {
      console.error('Error seeding:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedResearchPaperConfigs };
