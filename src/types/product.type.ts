import { Prisma } from '@/generated/prisma/client';

export type ProductType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  purchasePrice?: Prisma.Decimal | null;
  contents?: string | null;
  retailPriceNote?: string | null;
  brand?: string | null;
  status: string;
  purchaseUnit?: string | null;
  stockBaseUnit?: string | null;
  conversionQty?: number | null;
  salesMode?: string | null;
  allowUnitSale: boolean;
  allowFractional: boolean;
  legacyCode?: string | null;
  stock: number;
  categoryId: string;
  unitId: string | null;
  createdAt: Date;
  updatedAt: Date;
  unitConversions?: {
    id: string;
    fromUnit: string;
    toUnit: string;
    conversionQty: number;
    conversionType: string;
    active: boolean;
  }[];
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
  purchasePrice?: number | null;
  contents?: string | null;
  retailPriceNote?: string | null;
  stock: number;
  categoryId: string;
  unitId?: string | null;
};
