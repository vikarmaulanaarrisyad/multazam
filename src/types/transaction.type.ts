import { Transaction as PrismaTransaction } from '@/generated/prisma/client';
import { z } from 'zod';

export type Transaction = PrismaTransaction;

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

export type PreOrderData = z.infer<typeof PreOrderSchema>;

export interface UpdateTransactionStatusDTO {
  transactionId: string;
  status: string;
  notes?: string;
}

export interface CancelTransactionDTO {
  transactionId: string;
  adminNotes: string;
}

export interface AddPaymentDTO {
  transactionId: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}
