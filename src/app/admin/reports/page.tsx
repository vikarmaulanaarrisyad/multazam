import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ReportsClient from './ReportsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pusat Laporan | DIA MAKMUR ABADI',
};

export default async function ReportsPage() {
  const session = await auth();

  // Membatasi akses Pusat Laporan hanya untuk SUPER_ADMIN (Pimpinan) atau ADMIN (jika user mau admin bisa, tapi deskripsi: "pimpinan/Super Admin"). Saya set SUPER_ADMIN dulu, tapi karena ini di admin panel, saya biarkan SUPER_ADMIN / ADMIN sesuai request "agar pimpinan (Super Admin) bisa mendownload".
  if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    redirect('/admin');
  }

  return <ReportsClient />;
}
