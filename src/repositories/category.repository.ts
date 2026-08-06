import prisma from '@/lib/prisma';
import { CategoryInput, CategoryType, CategoryWithProductCount } from '@/types/category.type';

export const categoryRepository = {
  async findAllWithProductCount(): Promise<CategoryWithProductCount[]> {
    return prisma.category.findMany({
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

  async findPaginated(skip: number, take: number, search?: string): Promise<[CategoryWithProductCount[], number]> {
    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const,
      }
    } : {};

    const [data, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        skip,
        take,
        include: {
          _count: { select: { products: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.count({ where }),
    ]);

    return [data, total];
  },

  async findById(id: string): Promise<CategoryWithProductCount | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  async findByName(name: string): Promise<CategoryType | null> {
    return prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  },

  async findByNameExcludingId(name: string, excludeId: string): Promise<CategoryType | null> {
    return prisma.category.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: excludeId },
      },
    });
  },

  async create(data: CategoryInput): Promise<CategoryType> {
    return prisma.category.create({
      data: { name: data.name },
    });
  },

  async update(id: string, data: CategoryInput): Promise<CategoryType> {
    return prisma.category.update({
      where: { id },
      data: { name: data.name },
    });
  },

  async deleteById(id: string): Promise<CategoryType> {
    return prisma.category.delete({
      where: { id },
    });
  }
};
