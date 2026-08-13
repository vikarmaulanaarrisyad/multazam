import { config } from 'dotenv';
config();

import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting deletion process...');

  const unitConversions = await prisma.unitConversion.deleteMany({});
  console.log(`Deleted ${unitConversions.count} unit conversions`);

  const returnItems = await prisma.returnItem.deleteMany({});
  console.log(`Deleted ${returnItems.count} return items`);

  const returnTransactions = await prisma.returnTransaction.deleteMany({});
  console.log(`Deleted ${returnTransactions.count} return transactions`);

  const purchaseItems = await prisma.purchaseItem.deleteMany({});
  console.log(`Deleted ${purchaseItems.count} purchase items`);

  const purchases = await prisma.purchase.deleteMany({});
  console.log(`Deleted ${purchases.count} purchases`);

  const paymentHistories = await prisma.paymentHistory.deleteMany({});
  console.log(`Deleted ${paymentHistories.count} payment histories`);

  const transactionItems = await prisma.transactionItem.deleteMany({});
  console.log(`Deleted ${transactionItems.count} transaction items`);

  const transactions = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${transactions.count} transactions`);

  const stockMovements = await prisma.stockMovement.deleteMany({});
  console.log(`Deleted ${stockMovements.count} stock movements`);

  const products = await prisma.product.deleteMany({});
  console.log(`Deleted ${products.count} products`);

  const categories = await prisma.category.deleteMany({});
  console.log(`Deleted ${categories.count} categories`);

  const units = await prisma.unit.deleteMany({});
  console.log(`Deleted ${units.count} units`);

  console.log('Successfully deleted all requested data.');
}

main()
  .catch((e) => {
    console.error('Error during deletion:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
