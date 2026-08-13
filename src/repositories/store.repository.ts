import prisma from '@/lib/prisma';
import { CreateStoreDTO } from '../types/store.type';

export class StoreRepository {
  static async create(data: CreateStoreDTO) {
    return prisma.store.create({ data });
  }

  static async findById(id: string) {
    return prisma.store.findUnique({ where: { id } });
  }

  static async findByUserId(userId: string) {
    return prisma.store.findMany({
      take: 300, // Proteksi DoS/Memory Leak
      where: { userId },
      select: { id: true, name: true, address: true, ownerName: true, latitude: true, longitude: true },
      orderBy: { name: 'asc' }
    });
  }

  static async findStoresWithCoordinates() {
    return prisma.store.findMany({
      take: 300, // Proteksi DoS/Memory Leak
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        user: { select: { name: true } },
        visits: {
          select: { status: true, scheduledAt: true },
          orderBy: { scheduledAt: 'desc' },
          take: 1
        }
      }
    });
  }
}
