'use server';

import { NotificationService } from '@/services/notification.service';

export async function markNotificationAsRead(id: string) {
  try {
    await NotificationService.markAsRead(id);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(role: string) {
  try {
    await NotificationService.markAllAsRead(role);
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return { success: false };
  }
}
