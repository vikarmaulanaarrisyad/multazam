import { z } from 'zod';

export const productSchema = z.object({
  code: z.string().max(50, 'Kode produk maksimal 50 karakter').optional(),
  name: z
    .string()
    .min(1, 'Nama produk wajib diisi')
    .max(100, 'Nama produk maksimal 100 karakter')
    .trim(),
  brand: z.string().max(50, 'Brand maksimal 50 karakter').optional().nullable(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().nullable(),
  price: z.coerce.number().min(0, 'Harga jual tidak boleh negatif'),
  minPrice: z.coerce.number().min(0, 'Harga terbawah tidak boleh negatif').optional().nullable(),
  purchasePrice: z.coerce.number().min(0, 'Harga beli tidak boleh negatif').optional().nullable(),
  retailPriceNote: z.string().max(100).optional().nullable(),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  unitId: z.string().nullable().optional().transform(val => val === '' ? null : val),
  purchaseUnit: z.string().max(20).optional().nullable(),
  stockBaseUnit: z.string().max(20).optional().nullable(),
  conversionQty: z.coerce.number().int().min(1, 'Qty konversi minimal 1').optional().nullable(),
  status: z.string().optional().default('ACTIVE'),
  salesMode: z.string().optional().nullable(),
  allowUnitSale: z.boolean().optional().default(true),
  allowFractional: z.boolean().optional().default(false),
  legacyCode: z.string().max(50).optional().nullable(),
  retailEndDate: z.union([z.date(), z.string(), z.null()]).optional(),
  unitConversions: z.array(z.object({
    id: z.string().optional(),
    fromUnit: z.string().min(1, 'Satuan asal wajib diisi').max(20),
    toUnit: z.string().min(1, 'Satuan tujuan wajib diisi').max(20),
    conversionQty: z.coerce.number().int().min(1, 'Qty konversi minimal 1'),
    conversionType: z.string().optional().default('MULTIPLY'),
    active: z.boolean().optional().default(true),
  })).optional(),
});
