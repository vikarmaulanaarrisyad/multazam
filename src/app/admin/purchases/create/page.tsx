import { getAllSuppliers } from '@/actions/suppliers';
import { getAllProducts } from '@/actions/products';
import { CreatePurchaseClient } from './_components/create-purchase-client';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Buat Restock Baru | Multazam',
  description: 'Buat transaksi penerimaan barang baru',
};

export default async function CreatePurchasePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const suppliersRes = await getAllSuppliers();
  const productsRes = await getAllProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Restock Barang Baru</h1>
        <p className="text-sm text-slate-500">
          Buat pesanan pembelian baru untuk menambah stok gudang.
        </p>
      </div>

      <CreatePurchaseClient 
        suppliers={suppliersRes.data || []} 
        products={productsRes.data || []} 
        userId={session.user.id}
      />
    </div>
  );
}
