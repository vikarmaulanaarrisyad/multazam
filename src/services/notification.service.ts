import { NotificationRepository } from '../repositories/notification.repository';

export class NotificationService {
  static async markAsRead(id: string) {
    return NotificationRepository.markAsRead(id);
  }
  static async markAllAsRead(role: string) {
    return NotificationRepository.markAllAsRead(role);
  }
}
