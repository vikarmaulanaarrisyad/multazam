'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function logAudit(action: string, entityType: string, entityId: string, details: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return; // Don't crash, just ignore if not authenticated

    // Fire and forget, don't await this if it's not critical for the flow
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action,
        entityType,
        entityId,
        details
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export async function getAuditLogs(page = 1, limit = 50) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } }
        }
      }),
      prisma.auditLog.count()
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return { success: false, error: 'Gagal mengambil data log aktivitas.' };
  }
}
