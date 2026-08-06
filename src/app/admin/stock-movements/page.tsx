import { getStockMovementsPaginated } from '@/actions/stock-movements';
import { StockMovementsClient } from './_components/stock-movements-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Riwayat Stok | Multazam',
  description: 'Manajemen riwayat pergerakan stok gudang',
};

export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const limit = typeof resolvedParams.limit === 'string' ? parseInt(resolvedParams.limit) : 10;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;

  const result = await getStockMovementsPaginated(page, limit, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Riwayat Pergerakan Stok</h1>
        <p className="text-sm text-slate-500">
          Pantau semua aktivitas barang masuk dan keluar di gudang.
        </p>
      </div>

      <StockMovementsClient 
        initialData={result.data || []} 
        metadata={result.metadata || { total: 0, pageCount: 0 }}
      />
    </div>
  );
}
