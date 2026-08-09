import { Metadata } from 'next';
import { auth } from '@/auth';
import { getReturns } from '@/actions/return-actions';
import ReturnsClient from './_components/ReturnsClient';

export const metadata: Metadata = {
  title: 'Retur Produk - Multazam App',
};

export const dynamic = 'force-dynamic';

export default async function ReturnsPage() {
  const session = await auth();
  const result = await getReturns('SALES', session?.user?.id);
  const returns = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Retur Produk & Tukar Guling</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Kelola pengembalian barang dari pelanggan (Refund atau Tukar Guling).
        </p>
      </div>

      <ReturnsClient data={returns} />
    </div>
  );
}
