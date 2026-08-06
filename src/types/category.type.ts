import { z } from 'zod';
import { categorySchema } from '@/validations/category.validation';

export type CategoryInput = z.infer<typeof categorySchema>;

export type CategoryType = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryWithProductCount = CategoryType & {
  _count: { products: number };
};
