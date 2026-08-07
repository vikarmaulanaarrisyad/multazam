'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { $Enums } from '@prisma/client';

const UserSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(50),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SALES']),
});

export async function getUsers() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak');
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

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

    const parsedData = UserSchema.parse(data);
    
    if (!parsedData.password) {
      throw new Error('Password wajib diisi untuk pengguna baru');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email }
    });

    if (existingUser) {
      throw new Error('Email ini sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(parsedData.password, 10);

    await prisma.user.create({
      data: {
        name: parsedData.name,
        email: parsedData.email,
        password: hashedPassword,
        role: parsedData.role as $Enums.Role
      }
    });

    revalidatePath('/super-admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as z.ZodError).errors[0].message };
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

    const parsedData = UserSchema.parse(data);

    // Check if email belongs to someone else
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email }
    });

    if (existingUser && existingUser.id !== id) {
      throw new Error('Email ini sudah terdaftar pada pengguna lain');
    }

    const updateData: any = {
      name: parsedData.name,
      email: parsedData.email,
      role: parsedData.role as $Enums.Role
    };

    if (parsedData.password && parsedData.password.trim() !== '') {
      updateData.password = await bcrypt.hash(parsedData.password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/super-admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as z.ZodError).errors[0].message };
    }
    return { success: false, error: error.message || 'Gagal mengubah data pengguna' };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak');
    }

    if (session?.user?.id === id) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri');
    }

    // Optional check: Ensure not deleting the last SUPER_ADMIN
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (userToDelete?.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
        throw new Error('Tidak dapat menghapus satu-satunya Super Admin');
      }
    }

    await prisma.user.delete({
      where: { id }
    });

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

    const defaultPassword = 'multazam' + Math.floor(1000 + Math.random() * 9000); // e.g. multazam1234
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    revalidatePath('/super-admin/users');
    return { success: true, newPassword: defaultPassword };
  } catch (error: any) {
    console.error('Failed to reset password:', error);
    return { success: false, error: error.message || 'Gagal mereset password pengguna' };
  }
}
