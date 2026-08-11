'use server';

import { productService } from '@/services/product.service';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logAudit } from '@/actions/audit-actions';

export async function getProductsPaginated(page: number = 1, limit: number = 10, search?: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: 'Unauthorized' };
  }
  const result = await productService.getPaginatedProducts(page, limit, search);
  if (result.success && result.data) {
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const serializedData = result.data.map((p: any) => ({
      ...p,
      price: p.price ? p.price.toString() : '0',
      purchasePrice: isAdmin && p.purchasePrice ? p.purchasePrice.toString() : null
    }));
    return { ...result, data: serializedData };
  }
  return result;
}

export async function getAllProducts() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: 'Unauthorized' };
  }
  const result = await productService.getAllProducts();
  if (result.success && result.data) {
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const serializedData = result.data.map((p: any) => ({
      ...p,
      price: p.price ? p.price.toString() : '0',
      purchasePrice: isAdmin && p.purchasePrice ? p.purchasePrice.toString() : null
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
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await productService.createProduct(dataInput);
  if (result.success) {
    await logAudit('CREATE', 'PRODUCT', result.data.id, `Membuat produk baru: ${dataInput.code} - ${dataInput.name} (Harga: Rp${dataInput.price})`);
    revalidatePath('/admin/products');
  }
  return result;
}

export async function importProductsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
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
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await productService.updateProduct(id, dataInput);
  if (result.success) {
    await logAudit('UPDATE', 'PRODUCT', id, `Mengubah produk: ${dataInput.code} - ${dataInput.name}`);
    revalidatePath('/admin/products');
  }
  return result;
}

export async function deleteProductAction(id: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await productService.deleteProduct(id);
  if (result.success) {
    await logAudit('DELETE', 'PRODUCT', id, `Menghapus produk.`);
    revalidatePath('/admin/products');
  }
  return result;
}

export async function deleteManyProducts(ids: string[]) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await productService.deleteManyProducts(ids);
  if (result.success) {
    revalidatePath('/admin/products');
  }
  return result;
}
