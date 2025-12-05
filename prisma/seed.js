const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - remove this line if you want to keep existing data)
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing users');

  // Hash password - same for all test users for easy testing
  const hashedPassword = await bcrypt.hash('postgress123', 10);

  console.log('📝 Creating users...');

  // Create Admin user
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      user_role: 'admin',
      email_verify: true,
      email_verified_at: new Date(),
      is_active: true
    }
  });

  // Create Teacher user
  const teacher = await prisma.user.create({
    data: {
      username: 'teacher1',
      email: 'teacher@example.com',
      password: hashedPassword,
      user_role: 'teacher',
      email_verify: true,
      email_verified_at: new Date(),
      is_active: true
    }
  });

  // Create Student user
  const student = await prisma.user.create({
    data: {
      username: 'student1',
      email: 'student@example.com',
      password: hashedPassword,
      user_role: 'student',
      email_verify: true,
      email_verified_at: new Date(),
      is_active: true
    }
  });

  // Create another student for testing
  const student2 = await prisma.user.create({
    data: {
      username: 'student2',
      email: 'student2@example.com',
      password: hashedPassword,
      user_role: 'student',
      email_verify: false,
      is_active: true
    }
  });

  console.log('✅ Successfully created users:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 ADMIN USER');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Username: ${admin.username}`);
  console.log(`   Role: ${admin.user_role}`);
  console.log(`   Password: postgress123`);
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
