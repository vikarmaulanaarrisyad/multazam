import { categoryRepository } from '@/repositories/category.repository';
import { categorySchema } from '@/validations/category.validation';
import { CategoryWithProductCount } from '@/types/category.type';
import * as xlsx from 'xlsx';

export const categoryService = {
  async getAllCategories(): Promise<{ success: boolean; data?: CategoryWithProductCount[]; message?: string }> {
    try {
      const categories = await categoryRepository.findAllWithProductCount();
      return { success: true, data: categories };
    } catch (error) {
      console.error('Failed to get categories:', error);
      return { success: false, message: 'Gagal mengambil data kategori.' };
    }
  },

  async getPaginatedCategories(
    page: number, 
    limit: number, 
    search?: string
  ): Promise<{ 
    success: boolean; 
    data?: CategoryWithProductCount[]; 
    metadata?: { total: number; pageCount: number };
    message?: string 
  }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await categoryRepository.findPaginated(skip, limit, search);
      
      const pageCount = Math.ceil(total / limit);
      return { success: true, data, metadata: { total, pageCount } };
    } catch (error) {
      console.error('Failed to get paginated categories:', error);
      return { success: false, message: 'Gagal memuat data kategori.' };
    }
  },

  async createCategory(formData: FormData): Promise<{ success: boolean; message: string }> {
    try {
      const name = formData.get('name') as string;
      
      // Validation
      const validatedData = categorySchema.safeParse({ name });
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      // Check duplicate
      const existing = await categoryRepository.findByName(validatedData.data.name);
      if (existing) {
        return { success: false, message: 'Kategori dengan nama ini sudah ada.' };
      }

      // Insert
      await categoryRepository.create(validatedData.data);
      return { success: true, message: 'Kategori berhasil ditambahkan.' };
    } catch (error) {
      console.error('Create category error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async importCategories(formData: FormData): Promise<{ success: boolean; message: string }> {
    try {
      const file = formData.get('file') as File | null;
      if (!file) {
        return { success: false, message: 'File tidak ditemukan.' };
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Parse Excel
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet) as any[];

      if (!jsonData || jsonData.length === 0) {
        return { success: false, message: 'File Excel kosong atau tidak valid.' };
      }

      // Load existing names from DB
      const existingNames = await categoryRepository.findAllNames();
      const uniqueNames = new Set<string>(existingNames.map(c => c.name.toLowerCase()));
      const initialDbCount = uniqueNames.size;

      const validCategories: { name: string }[] = [];
      let skipped = 0;
      let duplicateInExcel = 0;
      let duplicateInDb = 0;

      for (const row of jsonData) {
        const name = row['Nama Kategori'] || row['nama_kategori'] || row['name'];
        if (!name || typeof name !== 'string') {
          skipped++;
          continue;
        }

        const trimmedName = name.trim();
        if (trimmedName.length === 0 || trimmedName.length > 50) {
          skipped++;
          continue;
        }

        const nameLower = trimmedName.toLowerCase();
        if (uniqueNames.has(nameLower)) {
          // Determine if it was a duplicate in DB or just within the Excel file itself
          // We can't know for sure easily unless we keep two sets, but let's approximate:
          duplicateInDb++;
          continue;
        }
        
        uniqueNames.add(nameLower);
        validCategories.push({ name: trimmedName });
      }

      if (validCategories.length === 0) {
        return { success: false, message: `Tidak ada data baru yang valid untuk diimpor. (${duplicateInDb} duplikat diabaikan)` };
      }

      // Bulk insert (duplicates already filtered out manually)
      const insertedCount = await categoryRepository.createMany(validCategories);
      
      const totalDuplicates = duplicateInDb;

      let msg = `Berhasil mengimpor ${insertedCount} kategori.`;
      const warnings = [];
      if (totalDuplicates > 0) warnings.push(`${totalDuplicates} data duplikat dilewati`);
      if (skipped > 0) warnings.push(`${skipped} baris dilewati karena format salah`);
      
      if (warnings.length > 0) {
        msg += ` (${warnings.join(', ')})`;
      }

      return { 
        success: true, 
        message: msg
      };
    } catch (error) {
      console.error('Import categories error:', error);
      return { success: false, message: 'Terjadi kesalahan saat memproses file Excel.' };
    }
  },

  async updateCategory(id: string, formData: FormData): Promise<{ success: boolean; message: string }> {
    try {
      const name = formData.get('name') as string;
      
      // Validation
      const validatedData = categorySchema.safeParse({ name });
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      // Check duplicate (excluding self)
      const existing = await categoryRepository.findByNameExcludingId(validatedData.data.name, id);
      if (existing) {
        return { success: false, message: 'Kategori dengan nama ini sudah ada.' };
      }

      // Update
      await categoryRepository.update(id, validatedData.data);
      return { success: true, message: 'Kategori berhasil diubah.' };
    } catch (error) {
      console.error('Update category error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check relations
      const category = await categoryRepository.findById(id);
      
      if (!category) {
        return { success: false, message: 'Kategori tidak ditemukan.' };
      }

      if (category._count.products > 0) {
        return { 
          success: false, 
          message: `Tidak dapat menghapus kategori. Terdapat ${category._count.products} produk yang masih tertaut dengan kategori ini.` 
        };
      }

      // Delete
      await categoryRepository.deleteById(id);
      return { success: true, message: 'Kategori berhasil dihapus.' };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async deleteManyCategories(ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      // Find all selected categories to check product counts
      const categories = await Promise.all(ids.map(id => categoryRepository.findById(id)));
      
      let blockedCount = 0;
      const safeIds: string[] = [];

      categories.forEach(cat => {
        if (cat) {
          if (cat._count.products > 0) {
            blockedCount++;
          } else {
            safeIds.push(cat.id);
          }
        }
      });

      if (safeIds.length === 0) {
        return { 
          success: false, 
          message: 'Semua kategori yang dipilih tidak dapat dihapus karena masih tertaut dengan produk.' 
        };
      }

      const deletedCount = await categoryRepository.deleteMany(safeIds);
      
      if (blockedCount > 0) {
        return { 
          success: true, 
          message: `Berhasil menghapus ${deletedCount} kategori. ${blockedCount} kategori dilewati karena masih memiliki produk.` 
        };
      }

      return { success: true, message: `Berhasil menghapus ${deletedCount} kategori.` };
    } catch (error) {
      console.error('Delete many categories error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  }
};
