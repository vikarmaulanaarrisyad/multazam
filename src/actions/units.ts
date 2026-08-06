'use server';

import { revalidatePath } from 'next/cache';
import { unitService } from '@/services/unit.service';

export async function getUnits() {
  return unitService.getAllUnits();
}

export async function getUnitsPaginated(page: number, limit: number, search?: string) {
  return unitService.getPaginatedUnits(page, limit, search);
}

export async function createUnit(formData: FormData) {
  const result = await unitService.createUnit(formData);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function importUnits(formData: FormData) {
  const result = await unitService.importUnits(formData);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function updateUnit(id: string, formData: FormData) {
  const result = await unitService.updateUnit(id, formData);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function deleteUnit(id: string) {
  const result = await unitService.deleteUnit(id);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}

export async function deleteManyUnits(ids: string[]) {
  const result = await unitService.deleteManyUnits(ids);
  if (result.success) {
    revalidatePath('/admin/units');
  }
  return result;
}
