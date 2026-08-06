import { categoryRepository } from '@/repositories/category.repository';
import { categorySchema } from '@/validations/category.validation';
import { CategoryWithProductCount } from '@/types/category.type';

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
  }
};
