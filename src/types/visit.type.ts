import { Visit as PrismaVisit, VisitStatus } from '@/generated/prisma/client';

export type Visit = PrismaVisit;

export interface CreateVisitDTO {
  storeId: string;
  scheduledAt: Date;
  notes?: string | null;
  address: string;
  status?: VisitStatus;
}

export interface VisitWithStore extends PrismaVisit {
  store: {
    id: string;
    name: string;
    user: {
      id: string;
      name: string | null;
    }
  }
}
