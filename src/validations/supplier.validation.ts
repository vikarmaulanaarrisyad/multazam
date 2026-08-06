import { z } from 'zod';

export const supplierSchema = z.object({
  code: z.string().max(50, 'Kode maksimal 50 karakter').optional(),
  name: z.string().min(1, 'Nama supplier harus diisi').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid').max(100, 'Email maksimal 100 karakter').optional().or(z.literal('')),
  phone: z.string().max(30, 'Nomor telepon maksimal 30 karakter').optional().or(z.literal('')),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional().or(z.literal('')),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
