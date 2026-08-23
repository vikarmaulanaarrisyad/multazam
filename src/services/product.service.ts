import { productRepository } from '@/repositories/product.repository';
import { categoryRepository } from '@/repositories/category.repository';
import { unitRepository } from '@/repositories/unit.repository';
import { stockMovementRepository } from '@/repositories/stock-movement.repository';
import { productSchema } from '@/validations/product.validation';
import { ProductWithRelations } from '@/types/product.type';
import * as xlsx from 'xlsx';
import crypto from 'crypto';

function generateSKU(name: string) {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X').padEnd(3, 'X');
  const uniqueId = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `PRD-${prefix}-${uniqueId}`;
}

export const productService = {
  async getAllProducts(): Promise<{ success: boolean; data?: ProductWithRelations[]; message?: string }> {
    try {
      const data = await productRepository.findAll();
      // Use map to serialize if necessary, but actually productRepository returns ProductWithRelations
      // and we just return it here. The Server Action does the serialization.
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get all products:', error);
      return { success: false, message: 'Gagal memuat semua produk.' };
    }
  },

  async getPaginatedProducts(
    page: number, 
    limit: number, 
    search?: string
  ): Promise<{ success: boolean; data?: ProductWithRelations[]; metadata?: { total: number; pageCount: number }; message?: string }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await productRepository.findPaginated(skip, limit, search);
      
      const pageCount = Math.ceil(total / limit);
      return { success: true, data, metadata: { total, pageCount } };
    } catch (error) {
      console.error('Failed to get paginated products:', error);
      return { success: false, message: 'Gagal memuat data produk.' };
    }
  },

  async createProduct(dataInput: { 
    code?: string;
    name: string;
    brand?: string | null;
    description?: string | null;
    price: number;
    minPrice?: number | null;
    purchasePrice?: number | null;
    retailPriceNote?: string | null;
    stock: number;
    categoryId: string;
    unitId?: string | null;
    purchaseUnit?: string | null;
    stockBaseUnit?: string | null;
    conversionQty?: number | null;
    status?: string;
    salesMode?: string | null;
    allowUnitSale?: boolean;
    allowFractional?: boolean;
    legacyCode?: string | null;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Validasi
      const validatedData = productSchema.safeParse(dataInput);
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      let code = validatedData.data.code?.trim() || '';
      
      // Auto-generate code if empty
      if (!code) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          code = generateSKU(validatedData.data.name);
          const existing = await productRepository.findByCode(code);
          if (!existing) isUnique = true;
          attempts++;
        }
        if (!isUnique) {
          return { success: false, message: 'Gagal membuat kode unik otomatis. Silakan isi kode produk secara manual.' };
        }
      } else {
        // Check duplicate code manually
        const existing = await productRepository.findByCode(code);
        if (existing) {
          return { success: false, message: `Kode produk '${code}' sudah digunakan.` };
        }
      }

      const createData = {
        ...validatedData.data,
        code,
        description: validatedData.data.description || null,
        unitId: validatedData.data.unitId || null,
      };

      const product = await productRepository.create(createData);
      
      if (product.stock > 0) {
        await stockMovementRepository.create({
          productId: product.id,
          type: 'IN',
          quantity: product.stock,
          balanceBefore: 0,
          balanceAfter: product.stock,
          reference: 'Stok Awal',
          notes: 'Produk baru ditambahkan',
        });
      }

      return { success: true, message: 'Produk berhasil ditambahkan.' };
    } catch (error) {
      console.error('Create product error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async importProducts(formData: FormData): Promise<{ success: boolean; message: string; errors?: string[] }> {
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

      // Load dependencies (Categories and Units)
      const categories = await categoryRepository.findAllIdAndNames();
      const units = await unitRepository.findAllIdAndNames();

      const categoryMap = new Map<string, string>();
      categories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

      const unitMap = new Map<string, string>();
      units.forEach(u => unitMap.set(u.name.toLowerCase(), u.id));

      // Fetch existing products to map name -> code for upsert
      const existingProducts = await productRepository.findAll();
      const productCodeMap = new Map<string, string>();
      existingProducts.forEach(p => productCodeMap.set(p.name.toLowerCase(), p.code));

      const validProducts = [];
      let skipped = 0;

      const parseIndoNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val || typeof val !== 'string') return NaN;
        return parseFloat(val.replace(/\./g, '').replace(/,/g, '.'));
      };
      let duplicateInDb = 0;
      const errorDetails: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // Assuming header is row 1
        
        const rawName = row['NAMA PRODUK'] || row['PRODUK'] || row['Nama Produk'] || row['nama_produk'] || row['name'];
        if (!rawName || typeof rawName !== 'string') {
          errorDetails.push(`Baris ${rowNum}: Nama produk kosong`);
          skipped++;
          continue;
        }

        const name = rawName.trim();
        if (name.length === 0 || name.length > 100) {
          errorDetails.push(`Baris ${rowNum}: Nama produk tidak valid (kosong atau terlalu panjang)`);
          skipped++;
          continue;
        }

        const categoryName = row['KATEGORI'] || row['Kategori'] || row['kategori'] || row['Category'];
        if (!categoryName || typeof categoryName !== 'string') {
          errorDetails.push(`Baris ${rowNum}: Kategori kosong untuk produk "${name}"`);
          skipped++;
          continue; // Kategori wajib
        }

        let categoryId = categoryMap.get(categoryName.trim().toLowerCase());
        if (!categoryId) {
          try {
            const newCategory = await categoryRepository.create({ name: categoryName.trim() });
            categoryId = newCategory.id;
            categoryMap.set(categoryName.trim().toLowerCase(), categoryId);
          } catch (error) {
            errorDetails.push(`Baris ${rowNum}: Gagal membuat kategori baru "${categoryName.trim()}"`);
            skipped++;
            continue;
          }
        }

        const unitName = row['SATUAN JUAL'] || row['Satuan Jual'] || row['Satuan'] || row['Unit'];
        let unitId = null;
        if (unitName && typeof unitName === 'string') {
          unitId = unitMap.get(unitName.trim().toLowerCase()) || null;
        }

        const rawPrice = row['HARGA JUAL'] || row['Harga Jual'] || row['HARGA KARTON'] || row['Harga'] || row['price'];
        let price = parseIndoNumber(rawPrice);
        if (isNaN(price) || price < 0) {
          price = 0;
        }

        const rawPurchasePrice = row['HARGA BELI'] || row['Harga Beli'] || null;
        let purchasePrice = null;
        if (rawPurchasePrice !== null) {
          const parsed = parseIndoNumber(rawPurchasePrice);
          if (!isNaN(parsed) && parsed >= 0) purchasePrice = parsed;
        }

        const rawMinPrice = row['HARGA TERBAWAH'] || row['Harga Terbawah'] || row['MIN PRICE'] || row['Min Price'] || null;
        let minPrice = null;
        if (rawMinPrice !== null) {
          const parsed = parseIndoNumber(rawMinPrice);
          if (!isNaN(parsed) && parsed >= 0) minPrice = parsed;
        }

        // New specific fields
        const brand = (row['BRAND'] || row['Brand'] || '')?.toString().trim() || null;
        const status = (row['STATUS'] || row['Status'] || 'ACTIVE')?.toString().trim();
        const purchaseUnit = (row['SATUAN BELI'] || row['Satuan Beli'] || '')?.toString().trim() || null;
        const stockBaseUnit = (row['SATUAN DASAR'] || row['Satuan Dasar'] || '')?.toString().trim() || null;
        
        const rawConvQty = row['QTY KONVERSI'] || row['Qty Konversi'] || row['QTY'] || null;
        let conversionQty = null;
        if (rawConvQty !== null) {
           const parsed = parseIndoNumber(rawConvQty);
           if (!isNaN(parsed) && parsed > 0) conversionQty = parsed;
        }

        const salesMode = (row['SALES MODE'] || row['Sales Mode'] || 'WHOLESALE_AND_RETAIL')?.toString().trim();
        
        const rawAllowUnitSale = row['JUAL SATUAN?'] || row['Jual Satuan?'];
        const allowUnitSale = rawAllowUnitSale === false || rawAllowUnitSale?.toString().trim().toUpperCase() === 'FALSE' ? false : true;

        const rawAllowFractional = row['JUAL PECAHAN?'] || row['Jual Pecahan?'];
        const allowFractional = rawAllowFractional === true || rawAllowFractional?.toString().trim().toUpperCase() === 'TRUE' ? true : false;
        
        const legacyCode = (row['LEGACY CODE'] || row['Legacy Code'] || '')?.toString().trim() || null;
        
        // Use either QTY KONVERSI or QTY for contents for backwards compatibility
        const contents = conversionQty?.toString() || (row['QTY'] || row['Qty'] || row['qty'] || row['ISI'] || row['isi'] || '')?.toString() || null;
        
        let retailPriceNote = (row['REF ECER'] || row['Ref Ecer'] || row['SATUAN ECER (BTL/RTG/PCS)'] || row['Satuan Ecer'] || '')?.toString().trim() || null;
        if (!retailPriceNote && price > 0) {
          retailPriceNote = price.toString();
        }

        const rawStock = row['STOK AWAL'] || row['Stok Awal'] || row['STOK'] || row['Stok'] || row['stok'] || row['stock'];
        let stock = parseIndoNumber(rawStock);
        if (isNaN(stock) || stock < 0) {
          stock = 0;
        }

        const description = row['DESKRIPSI'] || row['Deskripsi'] || row['deskripsi'] || row['description'] || null;

        let code = row['SKU'] || row['Kode Produk'] || row['kode_produk'] || row['code'] || row['KODE PRODUK'];
        if (code && typeof code === 'string' && code.trim().length > 0) {
          code = code.trim();
        } else {
          const existingCode = productCodeMap.get(name.toLowerCase());
          if (existingCode) {
            code = existingCode;
          } else {
            code = generateSKU(name);
          }
        }
        
        validProducts.push({
          code,
          name,
          brand,
          status,
          purchaseUnit,
          stockBaseUnit,
          conversionQty,
          salesMode,
          allowUnitSale,
          allowFractional,
          legacyCode,
          description,
          price,
          minPrice,
          purchasePrice,
          contents,
          retailPriceNote,
          stock,
          categoryId,
          unitId
        });
      }

      if (validProducts.length === 0) {
        return { success: false, message: `Tidak ada data baru yang valid untuk diimpor. Pastikan Kategori dan Nama Produk sesuai.`, errors: errorDetails };
      }

      // Bulk upsert (update if exists, insert if not)
      const upsertedCount = await productRepository.upsertMany(validProducts);
      
      let msg = `Berhasil mengimpor/memperbarui ${upsertedCount} produk.`;
      const warnings = [];
      if (skipped > 0) warnings.push(`${skipped} baris dilewati karena format salah`);
      
      if (warnings.length > 0) {
        msg += ` (${warnings.join(', ')}).`;
      }

      return { 
        success: true, 
        message: msg,
        errors: errorDetails.length > 0 ? errorDetails : undefined
      };
    } catch (error: any) {
      console.error('Import products error:', error);
      try {
        require('fs').writeFileSync('import-error.log', String(error) + '\n' + (error.stack || '') + '\n' + JSON.stringify(error, null, 2));
      } catch (e) {}
      return { success: false, message: 'Terjadi kesalahan saat memproses file Excel.' };
    }
  },

  async updateProduct(id: string, dataInput: { 
    code?: string;
    name: string;
    brand?: string | null;
    description?: string | null;
    price: number;
    minPrice?: number | null;
    purchasePrice?: number | null;
    retailPriceNote?: string | null;
    stock: number;
    categoryId: string;
    unitId?: string | null;
    purchaseUnit?: string | null;
    stockBaseUnit?: string | null;
    conversionQty?: number | null;
    status?: string;
    salesMode?: string | null;
    allowUnitSale?: boolean;
    allowFractional?: boolean;
    legacyCode?: string | null;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Validasi
      const validatedData = productSchema.safeParse(dataInput);
      if (!validatedData.success) {
        return { success: false, message: validatedData.error.issues[0].message };
      }

      const existingProduct = await productRepository.findById(id);
      if (!existingProduct) {
        return { success: false, message: 'Produk tidak ditemukan.' };
      }

      let code = validatedData.data.code?.trim() || '';
      
      // Auto-generate code if empty
      if (!code) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          code = generateSKU(validatedData.data.name);
          const existing = await productRepository.findByCode(code);
          if (!existing) isUnique = true;
          attempts++;
        }
        if (!isUnique) {
          return { success: false, message: 'Gagal membuat kode unik otomatis. Silakan isi kode produk secara manual.' };
        }
      } else {
        // Check duplicate code manually (excluding self)
        const existing = await productRepository.findByCodeExcludingId(code, id);
        if (existing) {
          return { success: false, message: `Kode produk '${code}' sudah digunakan.` };
        }
      }

      const updateData = {
        ...validatedData.data,
        code,
        description: validatedData.data.description || null,
        unitId: validatedData.data.unitId || null,
      };

      const updatedProduct = await productRepository.update(id, updateData);

      const stockDiff = updatedProduct.stock - existingProduct.stock;
      if (stockDiff !== 0) {
        await stockMovementRepository.create({
          productId: id,
          type: stockDiff > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(stockDiff),
          balanceBefore: existingProduct.stock,
          balanceAfter: updatedProduct.stock,
          reference: 'Update Manual',
          notes: 'Update stok melalui form produk',
        });
      }

      return { success: true, message: 'Produk berhasil diubah.' };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const product = await productRepository.findById(id);
      
      if (!product) {
        return { success: false, message: 'Produk tidak ditemukan.' };
      }

      await productRepository.deleteById(id);
      return { success: true, message: 'Produk berhasil dihapus.' };
    } catch (error: any) {
      console.error('Delete product error:', error);
      if (error?.code === 'P2003') {
        return { success: false, message: 'Produk tidak dapat dihapus karena masih digunakan dalam riwayat transaksi atau perpindahan stok. Harap nonaktifkan produk saja.' };
      }
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  },

  async deleteManyProducts(ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      if (!ids || ids.length === 0) {
        return { success: false, message: 'Tidak ada produk yang dipilih.' };
      }

      const deletedCount = await productRepository.deleteMany(ids);
      return { success: true, message: `Berhasil menghapus ${deletedCount} produk.` };
    } catch (error: any) {
      console.error('Delete many products error:', error);
      if (error?.code === 'P2003') {
        return { success: false, message: 'Beberapa produk tidak dapat dihapus karena masih digunakan dalam riwayat transaksi atau stok. Harap nonaktifkan produk tersebut.' };
      }
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  }
};
