'use server';

import { NotificationService } from '@/services/notification.service';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function markNotificationAsRead(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return { success: false, error: 'Notifikasi tidak ditemukan' };
    if (notification.role !== session.user.role) return { success: false, error: 'Akses ditolak' };

    await NotificationService.markAsRead(id);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(role: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== role) {
      return { success: false, error: 'Unauthorized' };
    }

    await NotificationService.markAllAsRead(role);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return { success: false };
  }
}
