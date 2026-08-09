import { StoreRepository } from '../repositories/store.repository';
import { CreateStoreDTO } from '../types/store.type';

export class StoreService {
  static async createStore(data: CreateStoreDTO) {
    if (!data.name || !data.ownerName || !data.address) {
      throw new Error("Lengkapi data toko yang wajib!");
    }
    return StoreRepository.create(data);
  }

  static async getStoresBySales(userId: string) {
    return StoreRepository.findByUserId(userId);
  }

  static async getMapLocations() {
    const stores = await StoreRepository.findStoresWithCoordinates();
    return stores.map(store => ({
      id: store.id,
      name: store.name,
      ownerName: store.ownerName,
      address: store.address,
      lat: store.latitude as number,
      lng: store.longitude as number,
      salesName: store.user.name || 'Sales',
      lastVisitStatus: store.visits[0]?.status || 'BELUM DIKUNJUNGI',
      lastVisitDate: store.visits[0]?.scheduledAt?.toISOString() || null
    }));
  }
}
