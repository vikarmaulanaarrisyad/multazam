import prismaPg from '@/lib/prisma';
import { PrismaClient as PrismaMysqlClient } from '@/generated/prisma-mysql/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

const dbUrl = new URL(process.env.MYSQL_DATABASE_URL || 'mysql://root:password@localhost:3306/multazam_sync');
const pool = mariadb.createPool({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
});
const adapter = new PrismaMariaDb(pool);
const prismaMysql = new PrismaMysqlClient({ adapter });

export async function syncPostgresToMysql() {
  console.log('Starting sync from PostgreSQL to MySQL...');
  
  try {
    // 1. Sync Categories
    const categories = await prismaPg.category.findMany();
    console.log(`Found ${categories.length} categories to sync.`);
    for (const category of categories) {
      await prismaMysql.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
        create: {
          id: category.id,
          name: category.name,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      });
    }

    // 2. Sync Products
    const products = await prismaPg.product.findMany();
    console.log(`Found ${products.length} products to sync.`);
    for (const product of products) {
      await prismaMysql.product.upsert({
        where: { id: product.id },
        update: {
          code: product.code,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
        create: {
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    }

    // 3. Sync Users (Needed for Transactions)
    const users = await prismaPg.user.findMany();
    console.log(`Found ${users.length} users to sync.`);
    for (const user of users) {
      await prismaMysql.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }

    // 4. Sync Transactions
    const transactions = await prismaPg.transaction.findMany();
    console.log(`Found ${transactions.length} transactions to sync.`);
    for (const trx of transactions) {
      await prismaMysql.transaction.upsert({
        where: { id: trx.id },
        update: {
          invoiceNumber: trx.invoiceNumber,
          userId: trx.userId,
          totalAmount: trx.totalAmount,
          status: trx.status,
          createdAt: trx.createdAt,
          updatedAt: trx.updatedAt,
        },
        create: {
          id: trx.id,
          invoiceNumber: trx.invoiceNumber,
          userId: trx.userId,
          totalAmount: trx.totalAmount,
          status: trx.status,
          createdAt: trx.createdAt,
          updatedAt: trx.updatedAt,
        },
      });
    }

    // 5. Sync Transaction Items
    const transactionItems = await prismaPg.transactionItem.findMany();
    console.log(`Found ${transactionItems.length} transaction items to sync.`);
    for (const item of transactionItems) {
      await prismaMysql.transactionItem.upsert({
        where: { id: item.id },
        update: {
          transactionId: item.transactionId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
        create: {
          id: item.id,
          transactionId: item.transactionId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
      });
    }

    console.log('Sync completed successfully.');
    return { success: true, message: 'Sync completed successfully' };
  } catch (error) {
    console.error('Error during sync:', error);
    return { success: false, message: 'Error during sync', error };
  } finally {
    // Optionally disconnect to prevent connection pooling limits if run infrequently
    await prismaMysql.$disconnect();
  }
}
