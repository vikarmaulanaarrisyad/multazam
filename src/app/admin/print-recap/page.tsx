import { getDeliveryRecapAction } from '@/actions/delivery-actions';
import { Package, Printer } from 'lucide-react';
import { redirect } from 'next/navigation';
import PrintButton from '@/app/admin/print-recap/PrintButton';

export const metadata = {
  title: 'Cetak Rekap Pengiriman',
};

export default async function PrintRecapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  let dateStr = resolvedSearchParams.date as string | undefined;
  if (!dateStr) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  }

  const recapRes = await getDeliveryRecapAction(dateStr);

  if (!recapRes.success) {
    redirect('/admin');
  }

  const items = recapRes.data || [];
  
  // Format tanggal dengan aman tanpa pergeseran Timezone Node
  const [year, month, day] = dateStr.split('-');
  const displayDate = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white min-h-screen text-slate-900 print:p-0 p-8 max-w-4xl mx-auto">
      {/* Hide on print, show on screen */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="font-bold text-lg">Pratinjau Cetak</h1>
          <p className="text-sm text-slate-500">Pastikan kertas berukuran A4 / Letter.</p>
        </div>
        <PrintButton />
      </div>

      {/* Print Document Content */}
      <div className="print-section">
        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-8 h-8" />
              REKAP BARANG GUDANG
            </h1>
            <p className="text-slate-600 mt-1 font-medium">DIA MAKMUR ABADI</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Pengiriman</p>
            <p className="text-lg font-bold text-slate-900">{displayDate}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
            Tidak ada barang yang perlu disiapkan untuk tanggal ini.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider w-12 text-center">No</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Kode</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Barang</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Isi (Kemasan)</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Qty Disiapkan</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Cek Gudang</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.productId} className="border-b border-slate-200">
                  <td className="py-3 px-4 text-sm font-medium text-slate-500 text-center">{index + 1}</td>
                  <td className="py-3 px-4 text-sm text-slate-500 font-mono">{item.code}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-slate-500 text-center">{item.contents || '-'}</td>
                  <td className="py-3 px-4 text-base font-bold text-blue-700 text-right bg-blue-50/50">{item.totalQuantity}</td>
                  {/* Kosong untuk dicentang oleh gudang */}
                  <td className="py-3 px-4 text-right">
                    <div className="w-6 h-6 border-2 border-slate-300 rounded ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-12 flex justify-between px-10 text-center">
          <div>
            <p className="text-sm text-slate-500 mb-16">Disiapkan Oleh (Gudang)</p>
            <p className="font-bold border-t border-slate-400 pt-2 px-8">Nama Terang</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-16">Mengetahui (Admin / Penanggung Jawab)</p>
            <p className="font-bold border-t border-slate-400 pt-2 px-8">Nama Terang</p>
          </div>
        </div>
      </div>
    </div>
  );
}
