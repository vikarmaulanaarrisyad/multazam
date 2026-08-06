import prisma from '@/lib/prisma';
import { ProductInput, ProductType, ProductWithRelations } from '@/types/product.type';

export const productRepository = {
  async findAll(): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: true,
        unit: true,
      }
    });
  },

  async findPaginated(skip: number, take: number, search?: string): Promise<[ProductWithRelations[], number]> {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          category: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return [data, total];
  },

  async findById(id: string): Promise<ProductWithRelations | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });
  },

  async findByCode(code: string): Promise<ProductType | null> {
    return prisma.product.findUnique({
      where: { code },
    });
  },

  async findByCodeExcludingId(code: string, excludeId: string): Promise<ProductType | null> {
    return prisma.product.findFirst({
      where: { 
        code,
        NOT: { id: excludeId },
      },
    });
  },

  async create(data: ProductInput & { code: string }): Promise<ProductType> {
    return prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        unitId: data.unitId,
      },
    });
  },

  async createMany(data: (ProductInput & { code: string })[]): Promise<number> {
    const result = await prisma.product.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  },

  async update(id: string, data: ProductInput & { code: string }): Promise<ProductType> {
    return prisma.product.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        unitId: data.unitId,
      },
    });
  },

  async deleteById(id: string): Promise<ProductType> {
    return prisma.product.delete({
      where: { id },
    });
  },

  async deleteMany(ids: string[]): Promise<number> {
    const result = await prisma.product.deleteMany({
      where: { id: { in: ids } }
    });
    return result.count;
  }
};
