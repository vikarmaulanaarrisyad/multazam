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

export async function getAuditLogs(page = 1, limit = 50, search?: string, startDate?: string, endDate?: string) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entityType: { contains: search } },
        { details: { contains: search } },
        { user: { name: { contains: search } } }
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } }
        }
      }),
      prisma.auditLog.count({ where })
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
