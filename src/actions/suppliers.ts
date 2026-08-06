'use server';

import { supplierService } from '@/services/supplier.service';
import { revalidatePath } from 'next/cache';

export async function getSuppliersPaginated(page: number = 1, limit: number = 10, search?: string) {
  return await supplierService.getPaginatedSuppliers(page, limit, search);
}

export async function getAllSuppliers() {
  return await supplierService.getAllSuppliers();
}

export async function createSupplierAction(data: {
  code?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  const result = await supplierService.createSupplier(data);
  if (result.success) {
    revalidatePath('/admin/suppliers');
  }
  return result;
}

export async function updateSupplierAction(id: string, data: {
  code?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  const result = await supplierService.updateSupplier(id, data);
  if (result.success) {
    revalidatePath('/admin/suppliers');
  }
  return result;
}

export async function deleteSupplierAction(id: string) {
  const result = await supplierService.deleteSupplier(id);
  if (result.success) {
    revalidatePath('/admin/suppliers');
  }
  return result;
}

export async function deleteManySuppliersAction(ids: string[]) {
  const result = await supplierService.deleteManySuppliers(ids);
  if (result.success) {
    revalidatePath('/admin/suppliers');
  }
  return result;
}
