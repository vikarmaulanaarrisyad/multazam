'use server';

import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mail';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function forgotPassword(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return a success message anyway to prevent email enumeration
      return { success: true, message: 'Jika email terdaftar, tautan reset telah dikirim.' };
    }

    // Generate token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    // Delete existing tokens for this user (identifier)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Save new token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send email
    await sendPasswordResetEmail(email, token);

    return { success: true, message: 'Jika email terdaftar, tautan reset telah dikirim.' };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem. Silakan coba lagi.' };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, message: 'Tautan reset tidak valid atau tidak ditemukan.' };
    }

    if (new Date(verificationToken.expires) < new Date()) {
      return { success: false, message: 'Tautan reset sudah kedaluwarsa. Silakan minta yang baru.' };
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return { success: true, message: 'Kata sandi berhasil direset. Silakan login dengan kata sandi baru Anda.' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem. Silakan coba lagi.' };
  }
}
