'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

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

    // Check if store already exists
    const existingStore = await prisma.store.findUnique({
      where: { userId: session.user.id }
    });

    if (existingStore) {
      return { success: false, error: 'Toko sudah terdaftar untuk akun ini' };
    }

    const store = await prisma.store.create({
      data: {
        userId: session.user.id,
        name: data.name,
        ownerName: data.ownerName,
        address: data.address,
        phone: data.phone || null,
      }
    });

    revalidatePath('/sales/requests/new');
    
    return { success: true, data: { id: store.id } };
  } catch (error: any) {
    console.error('Failed to create store:', error);
    return { success: false, error: error.message || 'Failed to submit store data' };
  }
}
