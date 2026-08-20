import { config } from 'dotenv';
config({ path: '.env.production' });
config({ path: '.env.development' });
config({ path: '.env' });

import { Role } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  const { default: prisma } = await import('../src/lib/prisma');
  
  console.log('Mulai proses seeding akun uji coba...');
  console.log('DATABASE_URL is:', process.env.DATABASE_URL);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@edia.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@edia.com',
      password: passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`Akun terbuat: ${superAdmin.email} (Role: SUPER_ADMIN)`);

  // 2. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@edia.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@edia.com',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`Akun terbuat: ${admin.email} (Role: ADMIN)`);

  // 3. Sales
  const sales = await prisma.user.upsert({
    where: { email: 'sales@edia.com' },
    update: {},
    create: {
      name: 'Alex Sales',
      email: 'sales@edia.com',
      password: passwordHash,
      role: Role.SALES,
    },
  });
  console.log(`Akun terbuat: ${sales.email} (Role: SALES)`);

  console.log('Proses seeding selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    console.log('Done.');
  });
