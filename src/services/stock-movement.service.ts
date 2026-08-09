import { stockMovementRepository, StockMovementWithProduct } from '@/repositories/stock-movement.repository';

export const stockMovementService = {
  async getPaginatedMovements(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ success: boolean; data?: StockMovementWithProduct[]; metadata?: { total: number; pageCount: number }; message?: string }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await stockMovementRepository.findPaginated(skip, limit, search);
      
      const pageCount = Math.ceil(total / limit);
      return { success: true, data, metadata: { total, pageCount } };
    } catch (error) {
      console.error('Failed to get paginated stock movements:', error);
      return { success: false, message: 'Gagal memuat riwayat pergerakan stok.' };
    }
  },

  async getAllMovements(
    search?: string
  ): Promise<{ success: boolean; data?: StockMovementWithProduct[]; message?: string }> {
    try {
      const data = await stockMovementRepository.findAll(search);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get all stock movements:', error);
      return { success: false, message: 'Gagal memuat seluruh riwayat pergerakan stok.' };
    }
  }
};
