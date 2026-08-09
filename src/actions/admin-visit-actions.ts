'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { StoreService } from '@/services/store.service';
import { VisitService } from '@/services/visit.service';
import { UserService } from '@/services/user.service';

export async function getSalesUsers() {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') return [];
  
  return UserService.getSalesUsers();
}

export async function getStoresBySales(userId: string) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') return [];
  
  return StoreService.getStoresBySales(userId);
}

export async function assignVisit(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      throw new Error("Unauthorized");
    }

    const salesId = formData.get('salesId') as string;
    let storeId = formData.get('storeId') as string;
    const scheduledAt = formData.get('scheduledAt') as string;
    const notes = formData.get('notes') as string | null;
    
    // For new store
    const isNewStore = formData.get('isNewStore') === 'true';
    if (isNewStore) {
      const storeName = formData.get('storeName') as string;
      const ownerName = formData.get('ownerName') as string;
      const address = formData.get('address') as string;
      const phone = formData.get('phone') as string | null;
      const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
      const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;

      const newStore = await StoreService.createStore({
        name: storeName,
        ownerName: ownerName,
        address: address,
        phone: phone,
        latitude: latitude,
        longitude: longitude,
        userId: salesId,
      });
      storeId = newStore.id;
    }

    if (!storeId || !salesId || !scheduledAt) {
      throw new Error("Data penugasan tidak lengkap");
    }

    await VisitService.assignVisit({
      storeId,
      scheduledAt,
      notes,
      userId: salesId
    });

    revalidatePath('/admin/visits');
    revalidatePath('/super-admin/visits');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menugaskan kunjungan" };
  }
}

export async function getAllVisits() {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') return [];

  return VisitService.getAllVisits();
}

export async function getMapLocations() {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') return [];

  return StoreService.getMapLocations();
}
