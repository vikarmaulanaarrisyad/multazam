'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { calculateBaseQuantity } from '@/utils/inventory';

export type DeliveryRecapItem = {
  productId: string;
  code: string;
  name: string;
  contents: string | null;
  totalQuantity: number;
  totalBaseQuantity: number;
  currentStock: number;
  unit: string;
  stockUnit: string;
  formattedStock: string;
};

export type StoreRecapItem = {
  customerName: string;
  salesName: string;
  items: {
    productId: string;
    code: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
};

export type DeliveryRecapResponse = {
  global: DeliveryRecapItem[];
  stores: StoreRecapItem[];
};

export async function getDeliveryRecapAction(dateString: string): Promise<{ success: boolean; data?: DeliveryRecapResponse; error?: string }> {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    // Parse tanggal dan gunakan rentang UTC yang merepresentasikan 00:00 hingga 23:59 WIB (UTC+7)
    const [year, month, day] = dateString.split('-').map(Number);
    
    // 00:00 WIB hari H adalah 17:00 UTC hari H-1
    const startDate = new Date(Date.UTC(year, month - 1, day - 1, 17, 0, 0));
    // 23:59:59 WIB hari H adalah 16:59:59 UTC hari H
    const endDate = new Date(Date.UTC(year, month - 1, day, 16, 59, 59));

    // Ambil transaksi yang pengirimannya dijadwalkan pada hari tersebut dan status valid
    const transactions = await prisma.transaction.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'COMPLETED', 'APPROVED', 'SHIPPED'], 
        }
      },
      include: {
        user: true, // Untuk ambil nama sales
        items: {
          include: {
            product: {
              include: {
                unitConversions: true
              }
            }
          }
        }
      }
    });

    if (transactions.length === 0) {
      return { success: true, data: { global: [], stores: [] } };
    }

    // Map untuk agregasi kuantitas global
    const globalRecapMap = new Map<string, DeliveryRecapItem>();
    
    // Map untuk agregasi per toko & sales
    // Key format: "CustomerName___SalesName"
    const storesMap = new Map<string, StoreRecapItem>();

    for (const tx of transactions) {
      const customerName = tx.customerName || 'Tanpa Nama Toko';
      const salesName = tx.user?.name || 'Tanpa Nama Sales';
      const storeKey = `${customerName}___${salesName}`;
      
      let storeRecap = storesMap.get(storeKey);
      if (!storeRecap) {
        storeRecap = {
          customerName,
          salesName,
          items: []
        };
        storesMap.set(storeKey, storeRecap);
      }

      for (const item of tx.items) {
        const prod = item.product;
        
        // Tentukan satuan yang di-request
        let requestedUnit = item.unitNote;
        if (!requestedUnit) {
          requestedUnit = prod.purchaseUnit || 'KARTON';
        }
        requestedUnit = requestedUnit.toUpperCase();
        
        const stockUnit = (prod.stockBaseUnit || 'PCS').toUpperCase();
        
        // Hitung kuantitas dalam satuan dasar untuk pengecekan stok
        const baseQty = calculateBaseQuantity(item.quantity, requestedUnit, prod);

        // --- GLOBAL RECAP ---
        const globalKey = `${prod.id}_${requestedUnit}`;

        let conversionQty = 1;
        if (item.quantity > 0) {
          conversionQty = baseQty / item.quantity;
        }

        let formattedStock = `${prod.stock} ${stockUnit}`;
        if (conversionQty > 1 && requestedUnit !== stockUnit && prod.stock > 0) {
          const majorQty = Math.floor(prod.stock / conversionQty);
          // Use Math.round to avoid floating point issues like 5.000000001
          const remainderQty = Math.round(prod.stock % conversionQty);
          
          if (majorQty > 0) {
            if (remainderQty > 0) {
              formattedStock = `${majorQty} ${requestedUnit} ${remainderQty} ${stockUnit}`;
            } else {
              formattedStock = `${majorQty} ${requestedUnit}`;
            }
          }
        }

        if (globalRecapMap.has(globalKey)) {
          const existing = globalRecapMap.get(globalKey)!;
          existing.totalQuantity += item.quantity;
          existing.totalBaseQuantity += baseQty;
        } else {
          globalRecapMap.set(globalKey, {
            productId: prod.id,
            code: prod.code,
            name: prod.name,
            contents: prod.contents,
            totalQuantity: item.quantity,
            totalBaseQuantity: baseQty,
            currentStock: prod.stock,
            unit: requestedUnit,
            stockUnit: stockUnit,
            formattedStock: formattedStock
          });
        }
        
        // --- STORE RECAP ---
        // Cek apakah item dengan satuan yang sama sudah ada di rincian toko ini
        const existingStoreItem = storeRecap.items.find(si => si.productId === prod.id && si.unit === requestedUnit);
        if (existingStoreItem) {
          existingStoreItem.quantity += item.quantity;
        } else {
          storeRecap.items.push({
            productId: prod.id,
            code: prod.code,
            name: prod.name,
            quantity: item.quantity,
            unit: requestedUnit
          });
        }
      }
    }

    // Ubah map menjadi array dan urutkan
    const globalArray = Array.from(globalRecapMap.values()).sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.unit.localeCompare(b.unit);
    });
    
    // Sort storesMap by customerName
    const storesArray = Array.from(storesMap.values()).sort((a, b) => a.customerName.localeCompare(b.customerName));
    
    // Sort items inside each store
    storesArray.forEach(store => {
      store.items.sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.unit.localeCompare(b.unit);
      });
    });

    return { success: true, data: { global: globalArray, stores: storesArray } };

  } catch (error: any) {
    console.error('Error fetching delivery recap:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memuat rekap.' };
  }
}

export type DriverDeliveryItem = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: string | null;
  totalAmount: number;
  paymentStatus: string;
  paidAmount: number;
  status: string;
  deliveryStatus: string;
  driverName: string | null;
  proofOfDeliveryUrl: string | null;
  driverNotes: string | null;
  salesName: string;
  items: {
    id: string;
    productId: string;
    code: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
  }[];
};

export async function getDriverDeliveryListAction(dateString: string): Promise<{ success: boolean; data?: DriverDeliveryItem[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day - 1, 17, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 16, 59, 59));

    const transactions = await prisma.transaction.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'COMPLETED', 'APPROVED', 'SHIPPED'],
        }
      },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { customerName: 'asc' }
    });

    const result: DriverDeliveryItem[] = transactions.map(tx => ({
      id: tx.id,
      invoiceNumber: tx.invoiceNumber,
      customerName: tx.customerName || 'Tanpa Nama Toko',
      customerPhone: tx.customerPhone,
      shippingAddress: tx.shippingAddress,
      totalAmount: Number(tx.totalAmount),
      paymentStatus: tx.paymentStatus,
      paidAmount: Number(tx.paidAmount),
      status: tx.status,
      deliveryStatus: tx.deliveryStatus || 'PENDING',
      driverName: tx.driverName,
      proofOfDeliveryUrl: tx.proofOfDeliveryUrl,
      driverNotes: tx.driverNotes,
      salesName: tx.user?.name || 'Sales',
      items: tx.items.map(item => ({
        id: item.id,
        productId: item.productId,
        code: item.product?.code || '',
        name: item.product?.name || 'Produk',
        quantity: item.quantity,
        price: Number(item.price),
        unit: item.unitNote || item.product?.purchaseUnit || 'KARTON'
      }))
    }));

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error fetching driver delivery list:', error);
    return { success: false, error: error.message || 'Gagal memuat daftar pengiriman supir.' };
  }
}

export async function updateDeliveryStatusAction(payload: {
  transactionId: string;
  deliveryStatus: string;
  proofOfDeliveryUrl?: string;
  driverNotes?: string;
  driverName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.transaction.update({
      where: { id: payload.transactionId },
      data: {
        deliveryStatus: payload.deliveryStatus,
        ...(payload.proofOfDeliveryUrl !== undefined ? { proofOfDeliveryUrl: payload.proofOfDeliveryUrl } : {}),
        ...(payload.driverNotes !== undefined ? { driverNotes: payload.driverNotes } : {}),
        ...(payload.driverName !== undefined ? { driverName: payload.driverName } : {})
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating delivery status:', error);
    return { success: false, error: error.message || 'Gagal mengupdate status pengiriman.' };
  }
}
