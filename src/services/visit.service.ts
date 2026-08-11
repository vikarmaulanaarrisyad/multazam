import { VisitRepository } from '../repositories/visit.repository';
import { StoreRepository } from '../repositories/store.repository';

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of earth in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class VisitService {
  static async markCompleted(visitId: string, userId: string, lat?: number, lng?: number) {
    const visit = await VisitRepository.findById(visitId);
    if (!visit) {
      throw new Error('Visit not found');
    }
    if (visit.userId !== userId) {
      throw new Error('FORBIDDEN');
    }

    if (visit.store.latitude && visit.store.longitude) {
      if (!lat || !lng) {
        throw new Error('Lokasi (Latitude & Longitude) wajib disertakan untuk Check-in toko ini.');
      }
      const distance = getDistanceInMeters(lat, lng, visit.store.latitude, visit.store.longitude);
      const MAX_RADIUS = 100; // meters
      
      if (distance > MAX_RADIUS) {
        throw new Error(`Anda terlalu jauh dari lokasi toko. Jarak: ${Math.round(distance)}m (Maks: ${MAX_RADIUS}m). Validasi server menolak check-in.`);
      }
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
 
