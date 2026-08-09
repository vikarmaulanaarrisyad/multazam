import prisma from '@/lib/prisma';
import { Role } from '@/generated/prisma/client';

export class UserRepository {
  static async findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findSalesUsers() {
    return prisma.user.findMany({
      where: { role: 'SALES' },
      select: { id: true, name: true, email: true }
    });
  }

  static async countSuperAdmins() {
    return prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
  }

  static async create(data: { name: string; email: string; password?: string | null; role: Role }) {
    return prisma.user.create({ data });
  }

  static async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
