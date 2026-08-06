import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export type PurchaseWithRelations = Prisma.PurchaseGetPayload<{
  include: {
    supplier: true;
    user: true;
    items: {
      include: { product: true }
    }
  }
}>;

export const purchaseRepository = {
  async findPaginated(skip: number, take: number, search?: string): Promise<[PurchaseWithRelations[], number]> {
    const where: Prisma.PurchaseWhereInput = search ? {
      OR: [
        { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
        { supplier: { name: { contains: search, mode: 'insensitive' as const } } },
      ]
    } : {};

    const [data, total] = await prisma.$transaction([
      prisma.purchase.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: true,
          user: true,
          items: {
            include: { product: true }
          }
        }
      }),
      prisma.purchase.count({ where }),
    ]);

    return [data, total];
  },

  async findById(id: string): Promise<PurchaseWithRelations | null> {
    return prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: true,
        items: {
          include: { product: true }
        }
      }
    });
  },

  async create(data: Prisma.PurchaseCreateInput): Promise<PurchaseWithRelations> {
    return prisma.purchase.create({
      data,
      include: {
        supplier: true,
        user: true,
        items: {
          include: { product: true }
        }
      }
    });
  },

  async updateStatus(id: string, status: string): Promise<PurchaseWithRelations> {
    return prisma.purchase.update({
      where: { id },
      data: { status },
      include: {
        supplier: true,
        user: true,
        items: {
          include: { product: true }
        }
      }
    });
  },
  
  async getLatestInvoiceNumber(): Promise<string | null> {
    const latest = await prisma.purchase.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    });
    return latest?.invoiceNumber || null;
  }
};
