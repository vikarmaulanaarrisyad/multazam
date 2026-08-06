import { Prisma } from '@/generated/prisma/client';

export type ProductType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  stock: number;
  categoryId: string;
  unitId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWithRelations = ProductType & {
  category: { id: string; name: string };
  unit: { id: string; name: string } | null;
};

export type ProductInput = {
  code?: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: string;
  unitId?: string | null;
};
