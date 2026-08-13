import prisma from '@/lib/prisma';
import { CreateVisitDTO } from '../types/visit.type';

export class VisitRepository {
  static async create(data: CreateVisitDTO) {
    return prisma.visit.create({ data });
  }

  static async findById(id: string) {
    return prisma.visit.findUnique({
      where: { id },
      include: { store: true }
    });
  }

  static async updateStatus(id: string, status: 'COMPLETED' | 'CANCELLED' | 'SCHEDULED', actualLat?: number, actualLng?: number) {
    return prisma.visit.update({
      where: { id },
      data: { 
        status,
        ...(status === 'COMPLETED' && actualLat !== undefined && actualLng !== undefined ? {
          actualLat,
          actualLng,
          checkInTime: new Date()
        } : {})
      }
    });
  }

  static async findAllVisits() {
    return prisma.visit.findMany({
      take: 200, // Proteksi DoS/Memory Leak
      include: {
        store: {
          include: {
            user: {
              select: { name: true, id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
