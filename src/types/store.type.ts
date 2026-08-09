import { Store as PrismaStore } from '@/generated/prisma/client';

export type Store = PrismaStore;

export interface CreateStoreDTO {
  name: string;
  ownerName: string;
  address: string;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  userId: string;
}

export interface StoreMapLocation {
  id: string;
  name: string;
  ownerName: string;
  address: string;
  lat: number;
  lng: number;
  salesName: string;
  lastVisitStatus: string;
  lastVisitDate: string | null;
}
