import { User as PrismaUser, Role } from '@/generated/prisma/client';
import { z } from 'zod';

export type User = PrismaUser;

export const UserSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(50),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SALES', 'DEVELOPER']),
});

export type CreateUserDTO = z.infer<typeof UserSchema>;
export type UpdateUserDTO = Partial<CreateUserDTO>;
