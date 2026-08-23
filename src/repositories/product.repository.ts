import prisma from '@/lib/prisma';
import { ProductInput, ProductType, ProductWithRelations } from '@/types/product.type';

export const productRepository = {
  async findAll(): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: true,
        unit: true,
        unitConversions: true,
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
          unitConversions: true,
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
        unitConversions: true,
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
        minPrice: data.minPrice,
        purchasePrice: data.purchasePrice,
        contents: data.contents,
        retailPriceNote: data.retailPriceNote,
        stock: data.stock,
        categoryId: data.categoryId,
        unitId: data.unitId,
        brand: data.brand,
        status: data.status,
        purchaseUnit: data.purchaseUnit,
        stockBaseUnit: data.stockBaseUnit,
        conversionQty: data.conversionQty,
        salesMode: data.salesMode,
        allowUnitSale: data.allowUnitSale,
        allowFractional: data.allowFractional,
        legacyCode: data.legacyCode,
        retailEndDate: data.retailEndDate ? new Date(data.retailEndDate) : null,
        ...(data.unitConversions?.length ? {
          unitConversions: {
            create: data.unitConversions.map(uc => ({
              fromUnit: uc.fromUnit,
              toUnit: uc.toUnit,
              conversionQty: uc.conversionQty,
              conversionType: uc.conversionType,
              active: uc.active
            }))
          }
        } : {})
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

  async upsertMany(data: (ProductInput & { code: string })[]): Promise<number> {
    const transactions = data.map(item => 
      prisma.product.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          description: item.description,
          price: item.price,
          minPrice: item.minPrice,
          purchasePrice: item.purchasePrice,
          contents: item.contents,
          retailPriceNote: item.retailPriceNote,
          categoryId: item.categoryId,
          unitId: item.unitId,
          brand: item.brand,
          status: item.status,
          purchaseUnit: item.purchaseUnit,
          stockBaseUnit: item.stockBaseUnit,
          conversionQty: item.conversionQty,
          salesMode: item.salesMode,
          allowUnitSale: item.allowUnitSale,
          allowFractional: item.allowFractional,
          legacyCode: item.legacyCode,
          retailEndDate: item.retailEndDate ? new Date(item.retailEndDate) : null,
        },
        create: {
          code: item.code,
          name: item.name,
          description: item.description,
          price: item.price,
          minPrice: item.minPrice,
          purchasePrice: item.purchasePrice,
          contents: item.contents,
          retailPriceNote: item.retailPriceNote,
          stock: item.stock,
          categoryId: item.categoryId,
          unitId: item.unitId,
          brand: item.brand,
          status: item.status,
          purchaseUnit: item.purchaseUnit,
          stockBaseUnit: item.stockBaseUnit,
          conversionQty: item.conversionQty,
          salesMode: item.salesMode,
          allowUnitSale: item.allowUnitSale,
          allowFractional: item.allowFractional,
          legacyCode: item.legacyCode,
          retailEndDate: item.retailEndDate ? new Date(item.retailEndDate) : null,
        }
      })
    );
    await prisma.$transaction(transactions, { maxWait: 15000, timeout: 30000 });
    return data.length;
  },

  async update(id: string, data: ProductInput & { code: string }): Promise<ProductType> {
    return prisma.product.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        price: data.price,
        minPrice: data.minPrice,
        purchasePrice: data.purchasePrice,
        contents: data.contents,
        retailPriceNote: data.retailPriceNote,
        stock: data.stock,
        categoryId: data.categoryId,
        unitId: data.unitId,
        brand: data.brand,
        status: data.status,
        purchaseUnit: data.purchaseUnit,
        stockBaseUnit: data.stockBaseUnit,
        conversionQty: data.conversionQty,
        salesMode: data.salesMode,
        allowUnitSale: data.allowUnitSale,
        allowFractional: data.allowFractional,
        legacyCode: data.legacyCode,
        retailEndDate: data.retailEndDate ? new Date(data.retailEndDate) : null,
        ...(data.unitConversions !== undefined ? {
          unitConversions: {
            deleteMany: {},
            create: data.unitConversions.map(uc => ({
              fromUnit: uc.fromUnit,
              toUnit: uc.toUnit,
              conversionQty: uc.conversionQty,
              conversionType: uc.conversionType,
              active: uc.active
            }))
          }
        } : {})
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
