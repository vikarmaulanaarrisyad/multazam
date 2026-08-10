'use server';

import { productService } from '@/services/product.service';
import { revalidatePath } from 'next/cache';

export async function getProductsPaginated(page: number = 1, limit: number = 10, search?: string) {
  const result = await productService.getPaginatedProducts(page, limit, search);
  if (result.success && result.data) {
    // Serialize Prisma Decimal to string to pass safely to Client Components
    const serializedData = result.data.map((p: any) => ({
      ...p,
      price: p.price ? p.price.toString() : '0',
      purchasePrice: p.purchasePrice ? p.purchasePrice.toString() : null
    }));
    return { ...result, data: serializedData };
  }
  return result;
}

export async function getAllProducts() {
  const result = await productService.getAllProducts();
  if (result.success && result.data) {
    const serializedData = result.data.map((p: any) => ({
      ...p,
      price: p.price ? p.price.toString() : '0',
      purchasePrice: p.purchasePrice ? p.purchasePrice.toString() : null
    }));
    return { ...result, data: serializedData };
  }
  return result;
}

export async function createProductAction(dataInput: { 
  code?: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  price: number;
  purchasePrice?: number | null;
  retailPriceNote?: string | null;
  stock: number;
  categoryId: string;
  unitId?: string | null;
  purchaseUnit?: string | null;
  stockBaseUnit?: string | null;
  conversionQty?: number | null;
  status?: string;
  salesMode?: string | null;
  allowUnitSale?: boolean;
  allowFractional?: boolean;
  legacyCode?: string | null;
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
  brand?: string | null;
  description?: string | null;
  price: number;
  purchasePrice?: number | null;
  retailPriceNote?: string | null;
  stock: number;
  categoryId: string;
  unitId?: string | null;
  purchaseUnit?: string | null;
  stockBaseUnit?: string | null;
  conversionQty?: number | null;
  status?: string;
  salesMode?: string | null;
  allowUnitSale?: boolean;
  allowFractional?: boolean;
  legacyCode?: string | null;
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
