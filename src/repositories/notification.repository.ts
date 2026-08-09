import prisma from '@/lib/prisma';

export class NotificationRepository {
  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: 'READ' }
    });
  }

  static async markAllAsRead(role: string) {
    return prisma.notification.updateMany({
      where: { role, status: 'UNREAD' },
      data: { status: 'READ' }
    });
  }
}
