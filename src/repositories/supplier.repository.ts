import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export type SupplierType = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const supplierRepository = {
  async findAll(): Promise<SupplierType[]> {
    return prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async findPaginated(skip: number, take: number, search?: string): Promise<[SupplierType[], number]> {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [data, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return [data, total];
  },

  async findById(id: string): Promise<SupplierType | null> {
    return prisma.supplier.findUnique({
      where: { id },
    });
  },

  async findByCode(code: string): Promise<SupplierType | null> {
    return prisma.supplier.findUnique({
      where: { code },
    });
  },

  async findByCodeExcludingId(code: string, id: string): Promise<SupplierType | null> {
    return prisma.supplier.findFirst({
      where: {
        code,
        id: { not: id },
      },
    });
  },

  async create(data: Omit<SupplierType, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierType> {
    return prisma.supplier.create({
      data,
    });
  },

  async update(id: string, data: Partial<Omit<SupplierType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SupplierType> {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<SupplierType> {
    return prisma.supplier.delete({
      where: { id },
    });
  },
  
  async deleteMany(ids: string[]): Promise<Prisma.BatchPayload> {
    return prisma.supplier.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }
};
