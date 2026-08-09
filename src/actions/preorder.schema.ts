import { z } from 'zod';

export const PreOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  shippingAddress: z.string().optional(),
  shippingCost: z.number().nonnegative().optional(),
  dpAmount: z.number().nonnegative().optional(),
  dueDate: z.preprocess(arg => new Date(arg as string), z.date()),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  ownerName: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
      originalPrice: z.number().nonnegative().optional()
    })
  ).min(1),
  clonedFromId: z.string().optional()
});
