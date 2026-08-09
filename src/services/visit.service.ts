import { VisitRepository } from '../repositories/visit.repository';
import { StoreRepository } from '../repositories/store.repository';

export class VisitService {
  static async markCompleted(visitId: string, userId: string, lat?: number, lng?: number) {
    const visit = await VisitRepository.findById(visitId);
    if (!visit) {
      throw new Error('Visit not found');
    }
    if (visit.userId !== userId) {
      throw new Error('FORBIDDEN');
    }
    return VisitRepository.updateStatus(visitId, 'COMPLETED', lat, lng);
  }

  static async assignVisit(data: { storeId: string; scheduledAt: string; notes?: string | null; userId: string }) {
    const store = await StoreRepository.findById(data.storeId);
    if (!store) throw new Error("Toko tidak ditemukan");

    return VisitRepository.create({
      storeId: data.storeId,
      userId: data.userId,
      scheduledAt: new Date(data.scheduledAt),
      notes: data.notes,
      address: store.address,
      status: 'SCHEDULED'
    });
  }

  static async getAllVisits() {
    const visits = await VisitRepository.findAllVisits();
    return visits.map(v => ({
      id: v.id,
      storeId: v.storeId,
      storeName: v.store.name,
      salesName: v.store.user.name || 'Sales',
      scheduledAt: v.scheduledAt.toISOString(),
      status: v.status,
      address: v.address,
      notes: v.notes
    }));
  }
}
 
