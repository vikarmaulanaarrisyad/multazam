'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { StoreService } from '@/services/store.service';

export interface StoreData {
  name: string;
  ownerName: string;
  address: string;
  phone?: string;
}

export async function createStore(data: StoreData) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const store = await StoreService.createStore({
      name: data.name,
      ownerName: data.ownerName,
      address: data.address,
      phone: data.phone || null,
      userId: session.user.id,
    });

    revalidatePath('/sales/requests/new');
    
    return { success: true, data: { id: store.id } };
  } catch (error: any) {
    console.error('Failed to create store:', error);
    return { success: false, error: error.message || 'Failed to submit store data' };
  }
}
