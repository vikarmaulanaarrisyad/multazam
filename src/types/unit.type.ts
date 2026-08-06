import { z } from 'zod';
import { unitSchema } from '@/validations/unit.validation';

export type UnitInput = z.infer<typeof unitSchema>;

export type UnitType = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UnitWithProductCount = UnitType & {
  _count: { products: number };
};
