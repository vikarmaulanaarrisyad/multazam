'use server';

import { auth } from '@/auth';
import { DashboardService } from '@/services/dashboard.service';

export async function getDashboardStats() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      throw new Error('Akses ditolak');
    }

    const data = await DashboardService.getStats();

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Failed to fetch dashboard stats:', error);
    return { success: false, error: 'Gagal memuat data dashboard' };
  }
}
