'use server';

import { supplierService } from '@/services/supplier.service';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getSuppliersPaginated(page: number = 1, limit: number = 10, search?: string) {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Unauthorized' };
  return await supplierService.getPaginatedSuppliers(page, limit, search);
}

export async function getAllSuppliers() {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Unauthorized' };
  return await supplierService.getAllSuppliers();
}

export async function createSupplierAction(data: {
  code?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
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
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await supplierService.updateSupplier(id, data);
  if (result.success) {
    revalidatePath('/admin/suppliers');
  }
  return result;
}

export async function deleteSupplierAction(id: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await supplierService.deleteSupplier(id);
  if (result.success) {
    revalidatePath('/admin/suppliers');
  }
  return result;
}

export async function deleteManySuppliersAction(ids: string[]) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Unauthorized / Akses Ditolak' };
  }
  const result = await supplierService.deleteManySuppliers(ids);
  if (result.success) {
    revalidatePath('/admin/suppliers');
  }
  return result;
}
