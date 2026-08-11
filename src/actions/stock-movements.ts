'use server';

import { stockMovementService } from '@/services/stock-movement.service';
import { auth } from '@/auth';

export async function getStockMovementsPaginated(page: number = 1, limit: number = 10, search?: string, startDate?: string, endDate?: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized' };
  }
  return await stockMovementService.getPaginatedMovements(page, limit, search, startDate, endDate);
}

export async function exportAllStockMovements(search?: string, startDate?: string, endDate?: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized' };
  }
  return await stockMovementService.getAllMovements(search, startDate, endDate);
}
