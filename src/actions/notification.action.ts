'use server';

import prisma from '@/lib/prisma';

export async function markNotificationAsRead(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { status: 'READ' }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(role: string) {
  try {
    await prisma.notification.updateMany({
      where: { role, status: 'UNREAD' },
      data: { status: 'READ' }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return { success: false };
  }
}
