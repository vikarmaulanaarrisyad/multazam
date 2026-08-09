import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import prisma from '../src/lib/prisma';
async function main() {
  console.log('Starting backfill for purchasePrice...');
  
  const transactions = await prisma.transaction.findMany({
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  let count = 0;
  for (const tx of transactions) {
    for (const item of tx.items) {
      if (!item.purchasePrice && item.product.purchasePrice) {
        await prisma.transactionItem.update({
          where: { id: item.id },
          data: {
            purchasePrice: item.product.purchasePrice
          }
        });
        count++;
      }
    }
  }

  console.log(`Backfill completed. Updated ${count} transaction items.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
