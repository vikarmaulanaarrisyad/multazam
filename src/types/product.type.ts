import { Prisma } from '@/generated/prisma/client';

export type ProductType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  minPrice?: Prisma.Decimal | null;
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
  retailEndDate?: Date | null;
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
  minPrice?: number | null;
  purchasePrice?: number | null;
  contents?: string | null;
  retailPriceNote?: string | null;
  stock: number;
  categoryId: string;
  unitId?: string | null;
  purchaseUnit?: string | null;
  stockBaseUnit?: string | null;
  conversionQty?: number | null;
  brand?: string | null;
  status?: string;
  salesMode?: string | null;
  allowUnitSale?: boolean;
  allowFractional?: boolean;
  legacyCode?: string | null;
  retailEndDate?: Date | string | null;
  unitConversions?: {
    id?: string;
    fromUnit: string;
    toUnit: string;
    conversionQty: number;
    conversionType: string;
    active: boolean;
  }[];
};
