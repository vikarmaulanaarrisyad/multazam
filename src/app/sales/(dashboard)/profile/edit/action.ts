'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email) {
      return { success: false, error: 'Nama dan Email wajib diisi' };
    }

    const dataToUpdate: any = {
      name,
      email,
    };

    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: dataToUpdate,
    });

    revalidatePath('/sales/profile');
    revalidatePath('/sales/profile/edit');
    
    return { success: true };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { success: false, error: 'Email sudah digunakan oleh akun lain' };
    }
    return { success: false, error: 'Terjadi kesalahan sistem' };
  }
}
