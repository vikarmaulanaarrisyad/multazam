import { Metadata } from 'next';
import AnalyticsClient from './_components/AnalyticsClient';
import { getDashboardAnalytics } from '@/actions/analytics-actions';

export const metadata: Metadata = {
  title: 'Analisis & Laba Rugi - Multazam App',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const result = await getDashboardAnalytics(6);
  const data = result.success && result.data ? result.data : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analisis & Laba Rugi</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Pantau performa bisnis, laba bersih, dan metrik penjualan secara komprehensif.
        </p>
      </div>

      <AnalyticsClient initialData={data} />
    </div>
  );
}
