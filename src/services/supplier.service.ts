import { supplierRepository, SupplierType } from '@/repositories/supplier.repository';
import { supplierSchema } from '@/validations/supplier.validation';

// Simple auto-generate code: SUP- + Random string or Date-based
function generateSupplierCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'S');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SUP-${prefix}${randomStr}`;
}

export const supplierService = {
  async getAllSuppliers(): Promise<{ success: boolean; data?: SupplierType[]; message?: string }> {
    try {
      const data = await supplierRepository.findAll();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get all suppliers:', error);
      return { success: false, message: 'Gagal memuat data supplier.' };
    }
  },

  async getPaginatedSuppliers(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ success: boolean; data?: SupplierType[]; metadata?: { total: number; pageCount: number }; message?: string }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await supplierRepository.findPaginated(skip, limit, search);
      
      const pageCount = Math.ceil(total / limit);
      return { success: true, data, metadata: { total, pageCount } };
    } catch (error) {
      console.error('Failed to get paginated suppliers:', error);
      return { success: false, message: 'Gagal memuat daftar supplier.' };
    }
  },

  async createSupplier(dataInput: { 
    code?: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const validatedData = supplierSchema.safeParse(dataInput);
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      let code = validatedData.data.code?.trim() || '';
      
      if (!code) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          code = generateSupplierCode(validatedData.data.name);
          const existing = await supplierRepository.findByCode(code);
          if (!existing) isUnique = true;
          attempts++;
        }
        if (!isUnique) {
          return { success: false, message: 'Gagal membuat kode unik. Silakan isi kode secara manual.' };
        }
      } else {
        const existing = await supplierRepository.findByCode(code);
        if (existing) {
          return { success: false, message: `Kode supplier '${code}' sudah digunakan.` };
        }
      }

      const createData = {
        name: validatedData.data.name,
        code,
        email: validatedData.data.email || null,
        phone: validatedData.data.phone || null,
        address: validatedData.data.address || null,
      };

      await supplierRepository.create(createData);
      return { success: true, message: 'Supplier berhasil ditambahkan.' };
    } catch (error) {
      console.error('Create supplier error:', error);
      return { success: false, message: 'Terjadi kesalahan sistem saat membuat supplier.' };
    }
  },

  async updateSupplier(id: string, dataInput: { 
    code?: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const validatedData = supplierSchema.safeParse(dataInput);
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      let code = validatedData.data.code?.trim() || '';
      
      if (!code) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          code = generateSupplierCode(validatedData.data.name);
          const existing = await supplierRepository.findByCode(code);
          if (!existing) isUnique = true;
          attempts++;
        }
        if (!isUnique) {
          return { success: false, message: 'Gagal membuat kode unik. Silakan isi kode secara manual.' };
        }
      } else {
        const existing = await supplierRepository.findByCodeExcludingId(code, id);
        if (existing) {
          return { success: false, message: `Kode supplier '${code}' sudah digunakan.` };
        }
      }

      const updateData = {
        name: validatedData.data.name,
        code,
        email: validatedData.data.email || null,
        phone: validatedData.data.phone || null,
        address: validatedData.data.address || null,
      };

      await supplierRepository.update(id, updateData);
      return { success: true, message: 'Supplier berhasil diperbarui.' };
    } catch (error) {
      console.error('Update supplier error:', error);
      return { success: false, message: 'Terjadi kesalahan sistem saat memperbarui supplier.' };
    }
  },

  async deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await supplierRepository.delete(id);
      return { success: true, message: 'Supplier berhasil dihapus.' };
    } catch (error) {
      console.error('Delete supplier error:', error);
      return { success: false, message: 'Gagal menghapus supplier, mungkin ada relasi yang terkait.' };
    }
  },

  async deleteManySuppliers(ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      await supplierRepository.deleteMany(ids);
      return { success: true, message: `${ids.length} supplier berhasil dihapus.` };
    } catch (error) {
      console.error('Delete many suppliers error:', error);
      return { success: false, message: 'Gagal menghapus beberapa supplier sekaligus.' };
    }
  }
};
