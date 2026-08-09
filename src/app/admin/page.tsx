import { DashboardClient } from '@/components/admin/DashboardClient';
import { getDashboardStats } from '@/actions/dashboard-actions';

export const metadata = {
  title: 'Dashboard Admin | DIA MAKMUR ABADI',
  description: 'Ringkasan analitik dan aktivitas toko',
};

export default async function AdminDashboard() {
  const statsRes = await getDashboardStats();

  if (!statsRes.success || !statsRes.data) {
    return (
      <div className="p-6 text-center text-red-500 font-bold bg-red-50 rounded-2xl">
        {statsRes.error || 'Gagal memuat data dashboard.'}
      </div>
    );
  }

  return <DashboardClient data={statsRes.data} role="ADMIN" />;
}
