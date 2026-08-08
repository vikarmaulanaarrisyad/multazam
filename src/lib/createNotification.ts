import prisma from '@/lib/prisma'; // Assuming this is your prisma client path

export async function createNotification(title: string, message: string, role: string = "ADMIN", link?: string) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        role,
        status: "UNREAD",
        link,
      }
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
