import { z } from 'zod';

export const productSchema = z.object({
  code: z.string().max(50, 'Kode produk maksimal 50 karakter').optional(),
  name: z
    .string()
    .min(1, 'Nama produk wajib diisi')
    .max(100, 'Nama produk maksimal 100 karakter')
    .trim(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().nullable(),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  unitId: z.string().nullable().optional().transform(val => val === '' ? null : val),
});
