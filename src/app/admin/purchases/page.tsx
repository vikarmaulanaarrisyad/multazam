import { getPurchasesPaginated } from '@/actions/purchases';
import { PurchasesClient } from './_components/purchases-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pembelian (Restock) | DIA MAKMUR ABADI',
  description: 'Manajemen pembelian dan restock barang',
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const limit = typeof resolvedParams.limit === 'string' ? parseInt(resolvedParams.limit) : 10;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;

  const result = await getPurchasesPaginated(page, limit, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pembelian / Restock</h1>
        <p className="text-sm text-slate-500">
          Kelola penerimaan barang dari supplier untuk menambah stok gudang.
        </p>
      </div>

      <PurchasesClient 
        initialData={result.data || []} 
        metadata={result.metadata || { total: 0, pageCount: 0 }}
      />
    </div>
  );
}
