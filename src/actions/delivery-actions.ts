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

    // Tentukan rentang waktu (00:00:00 hingga 23:59:59 pada zona UTC agar aman menutupi tanggal tersebut)
    const targetDate = new Date(dateString);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Ambil transaksi yang pengirimannya dijadwalkan pada hari tersebut dan status valid
    const transactions = await prisma.transaction.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'COMPLETED', 'APPROVED'], 
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
