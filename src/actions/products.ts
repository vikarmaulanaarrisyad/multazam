'use server';

import { productService } from '@/services/product.service';
import { revalidatePath } from 'next/cache';

export async function getProductsPaginated(page: number = 1, limit: number = 10, search?: string) {
  return await productService.getPaginatedProducts(page, limit, search);
}

export async function createProductAction(dataInput: { 
  code?: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: string;
  unitId?: string | null;
}) {
  const result = await productService.createProduct(dataInput);
  if (result.success) {
    revalidatePath('/admin/products');
  }
  return result;
}

export async function importProductsAction(formData: FormData) {
  const result = await productService.importProducts(formData);
  if (result.success) {
    revalidatePath('/admin/products');
  }
  return result;
}

export async function updateProductAction(id: string, dataInput: { 
  code?: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: string;
  unitId?: string | null;
}) {
  const result = await productService.updateProduct(id, dataInput);
  if (result.success) {
    revalidatePath('/admin/products');
  }
  return result;
}

export async function deleteProductAction(id: string) {
  const result = await productService.deleteProduct(id);
  if (result.success) {
    revalidatePath('/admin/products');
  }
  return result;
}

export async function deleteManyProducts(ids: string[]) {
  const result = await productService.deleteManyProducts(ids);
  if (result.success) {
    revalidatePath('/admin/products');
  }
  return result;
}
