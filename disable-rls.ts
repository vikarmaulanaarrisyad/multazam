import prisma from './src/lib/prisma';

async function main() {
  try {
    // Attempt to disable RLS on Notification just in case it was enabled
    await prisma.$executeRawUnsafe(`ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;`);
    console.log("RLS Disabled for Notification table.");
  } catch (e: any) {
    console.log("Failed to disable RLS:", e.message);
  }
}

main().catch(console.error);
