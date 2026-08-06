'use server';

import { revalidatePath } from 'next/cache';
import { categoryService } from '@/services/category.service';

export async function getCategories() {
  return categoryService.getAllCategories();
}

export async function getCategoriesPaginated(page: number, limit: number, search?: string) {
  return categoryService.getPaginatedCategories(page, limit, search);
}

export async function createCategory(formData: FormData) {
  const result = await categoryService.createCategory(formData);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function importCategories(formData: FormData) {
  const result = await categoryService.importCategories(formData);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function updateCategory(id: string, formData: FormData) {
  const result = await categoryService.updateCategory(id, formData);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function deleteCategory(id: string) {
  const result = await categoryService.deleteCategory(id);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function deleteManyCategories(ids: string[]) {
  const result = await categoryService.deleteManyCategories(ids);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}
