import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });
console.log('DB URL:', process.env.DATABASE_URL);

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearData() {
  console.log('Clearing database...');

  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints errors
    
    console.log('Deleting PaymentHistories...');
    await prisma.paymentHistory.deleteMany();

    console.log('Deleting ReturnItems...');
    await prisma.returnItem.deleteMany();

    console.log('Deleting ReturnTransactions...');
    await prisma.returnTransaction.deleteMany();

    console.log('Deleting StockMovements...');
    await prisma.stockMovement.deleteMany();

    console.log('Deleting PurchaseItems...');
    await prisma.purchaseItem.deleteMany();

    console.log('Deleting Purchases...');
    await prisma.purchase.deleteMany();

    console.log('Deleting TransactionItems...');
    await prisma.transactionItem.deleteMany();

    console.log('Deleting Transactions...');
    await prisma.transaction.deleteMany();

    console.log('Deleting Visits...');
    await prisma.visit.deleteMany();

    console.log('Deleting Products...');
    await prisma.product.deleteMany();

    console.log('Deleting Categories...');
    await prisma.category.deleteMany();

    console.log('Deleting Units...');
    await prisma.unit.deleteMany();

    console.log('Database successfully cleared of transactional and product data!');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

clearData();
