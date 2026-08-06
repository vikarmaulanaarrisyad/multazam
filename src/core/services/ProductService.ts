import prisma from '@/lib/prisma';
import { Prisma } from '../../generated/prisma/client';

export class ProductService {
  /**
   * Mengambil data produk dengan server-side pagination dan pencarian.
   * Dirancang agar ringan (hanya mengambil data yang diperlukan pada halaman tersebut).
   */
  static async getProducts({
    page = 1,
    limit = 10,
    search = '',
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { name: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const pageCount = Math.ceil(totalCount / limit);

    return {
      data,
      pageCount,
      totalCount,
    };
  }

  static async createProduct(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.product.create({
      data,
    });
  }

  static async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  static async deleteProduct(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }
}
