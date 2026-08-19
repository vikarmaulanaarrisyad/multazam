import { config } from 'dotenv';
config({ path: '.env' });
import prisma from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding developer account...');

  const devEmail = 'developer@diamakmur.com';
  
  const existingDev = await prisma.user.findUnique({
    where: { email: devEmail },
  });

  if (existingDev) {
    console.log('Developer account already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash('developer123', 10);

  const developer = await prisma.user.create({
    data: {
      name: 'Developer DMA',
      email: devEmail,
      password: hashedPassword,
      role: 'DEVELOPER',
    },
  });

  console.log('Developer account created successfully:');
  console.log('Email:', devEmail);
  console.log('Password: developer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
