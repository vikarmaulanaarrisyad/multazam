import { unitRepository } from '@/repositories/unit.repository';
import { unitSchema } from '@/validations/unit.validation';
import { UnitWithProductCount } from '@/types/unit.type';
import * as xlsx from 'xlsx';

export const unitService = {
  async getAllUnits(): Promise<{ success: boolean; data?: UnitWithProductCount[]; message?: string }> {
    try {
      const units = await unitRepository.findAllWithProductCount();
      return { success: true, data: units };
    } catch (error) {
      console.error('Failed to get units:', error);
      return { success: false, message: 'Gagal mengambil data satuan.' };
    }
  },

  async getPaginatedUnits(
    page: number, 
    limit: number, 
    search?: string
  ): Promise<{ 
    success: boolean; 
    data?: UnitWithProductCount[]; 
    metadata?: { total: number; pageCount: number };
    message?: string 
  }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await unitRepository.findPaginated(skip, limit, search);
      
      const pageCount = Math.ceil(total / limit);
      return { success: true, data, metadata: { total, pageCount } };
    } catch (error) {
      console.error('Failed to get paginated units:', error);
      return { success: false, message: 'Gagal memuat data satuan.' };
    }
  },

  async createUnit(formData: FormData): Promise<{ success: boolean; message: string }> {
    try {
      const name = formData.get('name') as string;
      
      // Validation
      const validatedData = unitSchema.safeParse({ name });
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      // Check duplicate
      const existing = await unitRepository.findByName(validatedData.data.name);
      if (existing) {
        return { success: false, message: 'Satuan dengan nama ini sudah ada.' };
      }

      // Insert
      await unitRepository.create(validatedData.data);
      return { success: true, message: 'Satuan berhasil ditambahkan.' };
    } catch (error) {
      console.error('Create unit error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async importUnits(formData: FormData): Promise<{ success: boolean; message: string }> {
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
      const existingNames = await unitRepository.findAllNames();
      const uniqueNames = new Set<string>(existingNames.map(c => c.name.toLowerCase()));
      const initialDbCount = uniqueNames.size;

      const validUnits: { name: string }[] = [];
      let skipped = 0;
      let duplicateInExcel = 0;
      let duplicateInDb = 0;

      for (const row of jsonData) {
        const name = row['Nama Satuan'] || row['nama_satuan'] || row['name'];
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
        validUnits.push({ name: trimmedName });
      }

      if (validUnits.length === 0) {
        return { success: false, message: `Tidak ada data baru yang valid untuk diimpor. (${duplicateInDb} duplikat diabaikan)` };
      }

      // Bulk insert (duplicates already filtered out manually)
      const insertedCount = await unitRepository.createMany(validUnits);
      
      const totalDuplicates = duplicateInDb;

      let msg = `Berhasil mengimpor ${insertedCount} satuan.`;
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
      console.error('Import units error:', error);
      return { success: false, message: 'Terjadi kesalahan saat memproses file Excel.' };
    }
  },

  async updateUnit(id: string, formData: FormData): Promise<{ success: boolean; message: string }> {
    try {
      const name = formData.get('name') as string;
      
      // Validation
      const validatedData = unitSchema.safeParse({ name });
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      // Check duplicate (excluding self)
      const existing = await unitRepository.findByNameExcludingId(validatedData.data.name, id);
      if (existing) {
        return { success: false, message: 'Satuan dengan nama ini sudah ada.' };
      }

      // Update
      await unitRepository.update(id, validatedData.data);
      return { success: true, message: 'Satuan berhasil diubah.' };
    } catch (error) {
      console.error('Update unit error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async deleteUnit(id: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check relations
      const unit = await unitRepository.findById(id);
      
      if (!unit) {
        return { success: false, message: 'Satuan tidak ditemukan.' };
      }

      if (unit._count.products > 0) {
        return { 
          success: false, 
          message: `Tidak dapat menghapus satuan. Terdapat ${unit._count.products} produk yang masih tertaut dengan satuan ini.` 
        };
      }

      // Delete
      await unitRepository.deleteById(id);
      return { success: true, message: 'Satuan berhasil dihapus.' };
    } catch (error) {
      console.error('Delete unit error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async deleteManyUnits(ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      // Find all selected units to check product counts
      const units = await Promise.all(ids.map(id => unitRepository.findById(id)));
      
      let blockedCount = 0;
      const safeIds: string[] = [];

      units.forEach(cat => {
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
          message: 'Semua satuan yang dipilih tidak dapat dihapus karena masih tertaut dengan produk.' 
        };
      }

      const deletedCount = await unitRepository.deleteMany(safeIds);
      
      if (blockedCount > 0) {
        return { 
          success: true, 
          message: `Berhasil menghapus ${deletedCount} satuan. ${blockedCount} satuan dilewati karena masih memiliki produk.` 
        };
      }

      return { success: true, message: `Berhasil menghapus ${deletedCount} satuan.` };
    } catch (error) {
      console.error('Delete many units error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  }
};
