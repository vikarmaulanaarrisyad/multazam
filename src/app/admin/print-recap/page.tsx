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

  // Waktu Cetak
  const printTime = new Date().toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white min-h-screen text-slate-900 print:p-0 p-8 max-w-5xl mx-auto">
      {/* Hide on print, show on screen */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="font-bold text-lg">Pratinjau Cetak</h1>
          <p className="text-sm text-slate-500">Pastikan kertas berukuran A4 / Letter. Margin diatur ke 'Default' atau 'Minimum'.</p>
        </div>
        <PrintButton />
      </div>

      {/* Print Document Content */}
      <div className="print-section bg-white">
        {/* KOP SURAT (Letterhead) */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0">
                <Package className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">DIA MAKMUR ABADI</h1>
                <p className="text-slate-600 font-medium text-sm mt-1">Distributor & Supplier Resmi</p>
                <p className="text-slate-500 text-xs mt-0.5">Sistem Manajemen Inventori dan Logistik</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-700 uppercase tracking-widest">REKAP GUDANG</h2>
              <div className="mt-2 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tanggal Pengiriman</p>
                <p className="text-base font-bold text-slate-900">{displayDate}</p>
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
            Tidak ada barang yang perlu disiapkan untuk tanggal ini.
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-end">
              <p className="text-sm text-slate-600">
                Daftar barang yang harus disiapkan oleh tim gudang untuk pengiriman tanggal <span className="font-bold text-slate-900">{displayDate}</span>.
              </p>
              <p className="text-xs text-slate-400">Dicetak: {printTime}</p>
            </div>
            
            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-800 text-white border-b-2 border-slate-800">
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-12 text-center border-r border-slate-600">No</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider border-r border-slate-600">Kode</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider border-r border-slate-600">Nama Barang</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-600">Isi (Kemasan)</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right border-r border-slate-600">Qty Disiapkan</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right border-r border-slate-600">Stok Gudang</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-center">Cek</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const isInsufficient = item.currentStock < item.totalQuantity;
                  return (
                    <tr key={item.productId} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isInsufficient ? 'bg-red-50/50' : ''}`}>
                      <td className="py-2.5 px-4 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{index + 1}</td>
                      <td className="py-2.5 px-4 text-sm text-slate-600 font-mono border-r border-slate-200">{item.code}</td>
                      <td className="py-2.5 px-4 text-sm font-bold text-slate-900 border-r border-slate-200">
                        {item.name}
                        {isInsufficient && <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full align-middle">STOK KURANG</span>}
                      </td>
                      <td className="py-2.5 px-4 text-sm text-slate-600 text-center border-r border-slate-200">{item.contents || '-'}</td>
                      <td className="py-2.5 px-4 text-base font-bold text-blue-700 text-right bg-blue-50/30 border-r border-slate-200">{item.totalQuantity}</td>
                      <td className={`py-2.5 px-4 text-base font-bold text-right border-r border-slate-200 ${isInsufficient ? 'text-red-600' : 'text-emerald-600'}`}>{item.currentStock}</td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto bg-white"></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        <div className="mt-16 flex justify-around text-center">
          <div className="w-48">
            <p className="text-sm font-medium text-slate-500 mb-20">Disiapkan Oleh (Gudang)</p>
            <div className="border-t-2 border-slate-800 pt-2">
              <p className="font-bold text-slate-900">Nama & Tanda Tangan</p>
            </div>
          </div>
          <div className="w-48">
            <p className="text-sm font-medium text-slate-500 mb-20">Diperiksa Oleh (Checker)</p>
            <div className="border-t-2 border-slate-800 pt-2">
              <p className="font-bold text-slate-900">Nama & Tanda Tangan</p>
            </div>
          </div>
          <div className="w-48">
            <p className="text-sm font-medium text-slate-500 mb-20">Mengetahui (Admin / PJ)</p>
            <div className="border-t-2 border-slate-800 pt-2">
              <p className="font-bold text-slate-900">Nama & Tanda Tangan</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center print:block hidden">
          <p className="text-[10px] text-slate-400">Dokumen ini dihasilkan secara otomatis oleh Sistem Manajemen DIA MAKMUR ABADI.</p>
        </div>
      </div>
    </div>
  );
}
