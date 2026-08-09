'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { ApiResponse } from '../types/api-response';

export async function markVisitCompleted(visitId: string): Promise<ApiResponse<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    // Verify the visit belongs to a store owned by this user
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { store: true },
    });

    if (!visit) {
      return { success: false, error: 'Visit not found' };
    }

    if (visit.store.userId !== session.user.id) {
      return { success: false, error: 'FORBIDDEN' };
    }

    // Update status
    await prisma.visit.update({
      where: { id: visitId },
      data: { status: 'COMPLETED' },
    });

    revalidatePath('/sales/visits');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark visit as completed:', error);
    return { success: false, error: error.message || 'Failed to update visit' };
  }
}
