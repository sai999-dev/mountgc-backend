const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const testPassword = await bcrypt.hash('postgress123', 10);

  console.log('📝 Creating/updating users...');

  // Create/Update Admin user (upsert - won't duplicate if exists)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mountgc.com' },
    update: {
      password: adminPassword,
      email_verify: true,
      email_verified_at: new Date(),
      is_active: true
    },
    create: {
      username: 'admin',
      email: 'admin@mountgc.com',
      password: adminPassword,
      user_role: 'admin',
      email_verify: true,
      email_verified_at: new Date(),
      is_active: true
    }
  });

  // Create Teacher user (optional test user)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      username: 'teacher1',
      email: 'teacher@example.com',
      password: testPassword,
      user_role: 'teacher',
      email_verify: true,
      email_verified_at: new Date(),
      is_active: true
    }
  });

  // Create Student user (optional test user)
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      username: 'student1',
      email: 'student@example.com',
      password: testPassword,
      user_role: 'student',
      email_verify: true,
      email_verified_at: new Date(),
      is_active: true
    }
  });

  // Create another student for testing (optional test user)
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      username: 'student2',
      email: 'student2@example.com',
      password: testPassword,
      user_role: 'student',
      email_verify: false,
      is_active: true
    }
  });

  console.log('✅ Successfully created/updated users:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 ADMIN USER (PRODUCTION)');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Username: ${admin.username}`);
  console.log(`   Role: ${admin.user_role}`);
  console.log(`   Password: admin123`);
  console.log('');
  console.log('📌 TEACHER USER');
  console.log(`   Email: ${teacher.email}`);
  console.log(`   Username: ${teacher.username}`);
  console.log(`   Role: ${teacher.user_role}`);
  console.log(`   Password: postgress123`);
  console.log('');
  console.log('📌 STUDENT USER 1');
  console.log(`   Email: ${student.email}`);
  console.log(`   Username: ${student.username}`);
  console.log(`   Role: ${student.user_role}`);
  console.log(`   Password: postgress123`);
  console.log('');
  console.log('📌 STUDENT USER 2');
  console.log(`   Email: ${student2.email}`);
  console.log(`   Username: ${student2.username}`);
  console.log(`   Role: ${student2.user_role}`);
  console.log(`   Password: postgress123`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database');
  });
