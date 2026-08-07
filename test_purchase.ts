import { purchaseService } from './src/services/purchase.service';
import { supplierRepository } from './src/repositories/supplier.repository';
import { productRepository } from './src/repositories/product.repository';
import prisma from './src/lib/prisma';

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log('No user');
  
  const supplier = await prisma.supplier.findFirst();
  if (!supplier) return console.log('No supplier');

  const product = await prisma.product.findFirst();
  if (!product) return console.log('No product');

  const result = await purchaseService.createPurchase({
    supplierId: supplier.id,
    userId: user.id,
    notes: 'Test notes',
    items: [{
      productId: product.id,
      quantity: 1,
      price: 10000
    }]
  });

  console.log('Result:', result);
}

main().catch(console.error).finally(() => process.exit(0));
