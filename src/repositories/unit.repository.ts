import prisma from '@/lib/prisma';
import { UnitInput, UnitType, UnitWithProductCount } from '@/types/unit.type';

export const unitRepository = {
  async findAllWithProductCount(): Promise<UnitWithProductCount[]> {
    return prisma.unit.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async findAllNames(): Promise<{ name: string }[]> {
    return prisma.unit.findMany({
      select: { name: true }
    });
  },

  async findAllIdAndNames(): Promise<{ id: string; name: string }[]> {
    return prisma.unit.findMany({
      select: { id: true, name: true }
    });
  },

  async findPaginated(skip: number, take: number, search?: string): Promise<[UnitWithProductCount[], number]> {
    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const,
      }
    } : {};

    const [data, total] = await prisma.$transaction([
      prisma.unit.findMany({
        where,
        skip,
        take,
        include: {
          _count: { select: { products: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.unit.count({ where }),
    ]);

    return [data, total];
  },

  async findById(id: string): Promise<UnitWithProductCount | null> {
    return prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  async findByName(name: string): Promise<UnitType | null> {
    return prisma.unit.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  },

  async findByNameExcludingId(name: string, excludeId: string): Promise<UnitType | null> {
    return prisma.unit.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: excludeId },
      },
    });
  },

  async create(data: UnitInput): Promise<UnitType> {
    return prisma.unit.create({
      data: { name: data.name },
    });
  },

  async createMany(data: UnitInput[]): Promise<number> {
    const result = await prisma.unit.createMany({
      data: data.map(d => ({ name: d.name })),
      skipDuplicates: true,
    });
    return result.count;
  },

  async update(id: string, data: UnitInput): Promise<UnitType> {
    return prisma.unit.update({
      where: { id },
      data: { name: data.name },
    });
  },

  async deleteById(id: string): Promise<UnitType> {
    return prisma.unit.delete({
      where: { id },
    });
  },

  async deleteMany(ids: string[]): Promise<number> {
    const result = await prisma.unit.deleteMany({
      where: { id: { in: ids } }
    });
    return result.count;
  }
};
