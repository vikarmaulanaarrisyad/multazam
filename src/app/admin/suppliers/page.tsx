import { getSuppliersPaginated } from '@/actions/suppliers';
import { SuppliersClient } from './_components/suppliers-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Supplier | Multazam',
  description: 'Manajemen data pemasok (supplier)',
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const limit = typeof resolvedParams.limit === 'string' ? parseInt(resolvedParams.limit) : 10;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;

  const result = await getSuppliersPaginated(page, limit, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Data Supplier</h1>
        <p className="text-sm text-slate-500">
          Kelola data pemasok barang untuk keperluan restock.
        </p>
      </div>

      <SuppliersClient 
        initialData={result.data || []} 
        metadata={result.metadata || { total: 0, pageCount: 0 }}
      />
    </div>
  );
}
