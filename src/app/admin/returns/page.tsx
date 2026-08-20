import { Metadata } from 'next';
import { getReturns } from '@/actions/return-actions';
import AdminReturnsClient from './_components/AdminReturnsClient';

export const metadata: Metadata = {
  title: 'Persetujuan Retur - Edia App',
};

export const dynamic = 'force-dynamic';

export default async function AdminReturnsPage() {
  const result = await getReturns('ADMIN');
  const returns = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Persetujuan Retur</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Kelola dan tinjau pengajuan retur dari tim Sales.
        </p>
      </div>

      <AdminReturnsClient data={returns} />
    </div>
  );
}
