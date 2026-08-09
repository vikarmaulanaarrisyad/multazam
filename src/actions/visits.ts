'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ApiResponse } from '../types/api-response';
import { VisitService } from '@/services/visit.service';

export async function markVisitCompleted(visitId: string): Promise<ApiResponse<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    await VisitService.markCompleted(visitId, session.user.id);

    revalidatePath('/sales/visits');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark visit as completed:', error);
    return { success: false, error: error.message || 'Failed to update visit' };
  }
}
