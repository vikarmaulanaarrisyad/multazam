import prisma from './src/lib/prisma';

async function main() {
  const notifications = await prisma.notification.findMany();
  console.log('Notifications:', notifications);
}
main().catch(console.error);
