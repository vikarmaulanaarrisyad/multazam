import prisma from '@/lib/prisma';

export type StockMovementType = {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StockMovementWithProduct = StockMovementType & {
  product: { id: string; name: string; code: string };
};

export const stockMovementRepository = {
  async findPaginated(skip: number, take: number, search?: string): Promise<[StockMovementWithProduct[], number]> {
    const where = search ? {
      product: {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ]
      }
    } : {};

    const [data, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,
        skip,
        take,
        include: {
          product: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return [data as StockMovementWithProduct[], total];
  },

  async create(data: {
    productId: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    balanceBefore: number;
    balanceAfter: number;
    reference?: string | null;
    notes?: string | null;
  }): Promise<StockMovementType> {
    return prisma.stockMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        reference: data.reference,
        notes: data.notes,
      },
    }) as unknown as Promise<StockMovementType>;
  }
};
