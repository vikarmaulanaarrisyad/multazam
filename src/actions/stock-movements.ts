'use server';

import { stockMovementService } from '@/services/stock-movement.service';

export async function getStockMovementsPaginated(page: number = 1, limit: number = 10, search?: string, startDate?: string, endDate?: string) {
  return await stockMovementService.getPaginatedMovements(page, limit, search, startDate, endDate);
}

export async function exportAllStockMovements(search?: string, startDate?: string, endDate?: string) {
  return await stockMovementService.getAllMovements(search, startDate, endDate);
}
