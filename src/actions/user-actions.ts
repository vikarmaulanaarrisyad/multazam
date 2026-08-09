'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { UserService } from '@/services/user.service';
import { UserSchema } from '@/types/user.type';

export async function getUsers() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak');
    }

    const users = await UserService.getAllUsers();
    return { success: true, data: users };
  } catch (error: any) {
    console.error('Failed to get users:', error);
    return { success: false, error: error.message || 'Gagal memuat pengguna' };
  }
}

export async function createUser(data: z.infer<typeof UserSchema>) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak');
    }

    await UserService.createUser(data);

    revalidatePath('/super-admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'Gagal menambahkan pengguna' };
  }
}

export async function updateUser(id: string, data: z.infer<typeof UserSchema>) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak');
    }

    await UserService.updateUser(id, data);

    revalidatePath('/super-admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'Gagal mengubah data pengguna' };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN' || !session?.user?.id) {
      throw new Error('Akses ditolak');
    }

    await UserService.deleteUser(id, session.user.id);

    revalidatePath('/super-admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error.message || 'Gagal menghapus pengguna' };
  }
}

export async function resetPassword(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak');
    }

    const defaultPassword = await UserService.resetPassword(id);

    revalidatePath('/super-admin/users');
    return { success: true, newPassword: defaultPassword };
  } catch (error: any) {
    console.error('Failed to reset password:', error);
    return { success: false, error: error.message || 'Gagal mereset password pengguna' };
  }
}
