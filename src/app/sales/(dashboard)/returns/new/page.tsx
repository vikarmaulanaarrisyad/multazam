import { Metadata } from 'next';
import NewReturnClient from './_components/NewReturnClient';
import { productService } from '@/services/product.service';

export const metadata: Metadata = {
  title: 'Buat Retur - Multazam App',
};

export const dynamic = 'force-dynamic';

export default async function NewReturnPage() {
  const result = await productService.getAllProducts();
  const rawProducts = result.success && result.data ? result.data : [];
  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: typeof p.price === 'object' && p.price !== null && 'toNumber' in p.price 
      ? (p.price as any).toNumber() 
      : Number(p.price)
  }));
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buat Retur Baru</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Isi form di bawah ini untuk mengajukan retur produk.
        </p>
      </div>

      <NewReturnClient products={products} />
    </div>
  );
}
