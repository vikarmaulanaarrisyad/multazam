import React from 'react';
import prisma from '@/lib/prisma';
import { SalesProductsClient } from './_components/products-client';

export const metadata = {
  title: 'Products | Sales',
};

export default async function SalesProductsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const rawProducts = await prisma.product.findMany({
    include: { category: true, unit: true },
    orderBy: { name: 'asc' }
  });

  const products = rawProducts.map(p => ({
    ...p,
    price: p.price.toNumber(),
    purchasePrice: p.purchasePrice ? p.purchasePrice.toNumber() : null
  }));

  return (
    <div className="flex flex-col w-full h-full pb-20">
      <SalesProductsClient initialProducts={products} categories={categories} />
    </div>
  );
}
