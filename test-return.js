const { PrismaClient } = require('./src/generated/prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'SALES' } });
    const product = await prisma.product.findFirst();
    
    if (!user || !product) {
       console.log('Missing user or product');
       return;
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const count = await prisma.returnTransaction.count({
      where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } }
    });
    
    const returnNumber = 'RET-' + dateStr + '-' + (count + 1).toString().padStart(4, '0');
    console.log('Return Number:', returnNumber);

    const newReturn = await prisma.returnTransaction.create({
      data: {
        returnNumber,
        customerName: 'Test Customer',
        userId: user.id,
        type: 'EXCHANGE',
        status: 'PENDING',
        items: {
          create: [{
            productId: product.id,
            quantity: 1,
            condition: 'BAD',
            price: 15000,
          }]
        }
      }
    });
    console.log('Success!', newReturn.id);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
