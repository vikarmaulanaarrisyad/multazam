import prisma from './src/lib/prisma';

async function main() {
  await prisma.$executeRawUnsafe('DELETE FROM "Visit"');
  console.log('Visits deleted successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
