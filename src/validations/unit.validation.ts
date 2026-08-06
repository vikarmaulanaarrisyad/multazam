import { z } from 'zod';

export const unitSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama satuan wajib diisi')
    .max(50, 'Nama satuan maksimal 50 karakter')
    .trim(),
});
