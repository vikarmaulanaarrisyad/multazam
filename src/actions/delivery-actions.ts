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
};

export async function getDeliveryRecapAction(dateString: string): Promise<{ success: boolean; data?: DeliveryRecapItem[]; error?: string }> {
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
      return { success: true, data: [] };
    }

    // Map untuk agregasi kuantitas
    const recapMap = new Map<string, DeliveryRecapItem>();

    for (const tx of transactions) {
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

        const key = `${prod.id}_${requestedUnit}`;

        if (recapMap.has(key)) {
          const existing = recapMap.get(key)!;
          existing.totalQuantity += item.quantity;
          existing.totalBaseQuantity += baseQty;
        } else {
          recapMap.set(key, {
            productId: prod.id,
            code: prod.code,
            name: prod.name,
            contents: prod.contents,
            totalQuantity: item.quantity,
            totalBaseQuantity: baseQty,
            currentStock: prod.stock,
            unit: requestedUnit,
            stockUnit: stockUnit
          });
        }
      }
    }

    // Ubah map menjadi array dan urutkan berdasarkan nama barang lalu satuan
    const recapArray = Array.from(recapMap.values()).sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.unit.localeCompare(b.unit);
    });

    return { success: true, data: recapArray };

  } catch (error: any) {
    console.error('Error fetching delivery recap:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memuat rekap.' };
  }
}
