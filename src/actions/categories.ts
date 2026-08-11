'use server';

import { revalidatePath } from 'next/cache';
import { categoryService } from '@/services/category.service';
import { auth } from '@/auth';

export async function getCategories() {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Unauthorized' };
  return categoryService.getAllCategories();
}

export async function getCategoriesPaginated(page: number, limit: number, search?: string) {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Unauthorized' };
  return categoryService.getPaginatedCategories(page, limit, search);
}

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await categoryService.createCategory(formData);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function importCategories(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await categoryService.importCategories(formData);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await categoryService.updateCategory(id, formData);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await categoryService.deleteCategory(id);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function deleteManyCategories(ids: string[]) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await categoryService.deleteManyCategories(ids);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}
