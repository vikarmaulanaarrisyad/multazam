'use server';

import { revalidatePath } from 'next/cache';
import { unitService } from '@/services/unit.service';
import { auth } from '@/auth';

export async function getUnits() {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Unauthorized' };
  return unitService.getAllUnits();
}

export async function getUnitsPaginated(page: number, limit: number, search?: string) {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Unauthorized' };
  return unitService.getPaginatedUnits(page, limit, search);
}

export async function createUnit(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await unitService.createUnit(formData);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function importUnits(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await unitService.importUnits(formData);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function updateUnit(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await unitService.updateUnit(id, formData);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function deleteUnit(id: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await unitService.deleteUnit(id);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function deleteManyUnits(ids: string[]) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await unitService.deleteManyUnits(ids);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}
