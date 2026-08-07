import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintButton } from './_components/PrintButton';

function SuratJalanCopy({ transaction, title, hideCutLine }: any) {
  const invoiceNumber = transaction.invoiceNumber;
  const date = new Date(transaction.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalItemAmount = transaction.items.reduce((sum: any, item: any) => sum + (Number(item.price) * item.quantity), 0);
  const shippingCost = Number(transaction.shippingCost) || 0;
  const totalKeseluruhan = totalItemAmount + shippingCost;

  return (
    <div className={`w-full max-w-[210mm] bg-white p-6 print:p-0 mx-auto relative print:w-full flex flex-col justify-between ${!hideCutLine ? 'border-b-2 border-dashed border-slate-300 print:border-slate-400 pb-8 mb-8 print:pb-6 print:mb-6' : ''}`} style={{ minHeight: '160mm' }}>
      <div>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tighter">MULTAZAM</h1>
            <p className="text-slate-600 font-medium text-[10px] mt-1">Sistem Penjualan & Inventori Terpercaya</p>
            <p className="text-slate-500 text-[10px]">Jl. Contoh Alamat No. 123, Kota, Provinsi</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Surat Jalan</h2>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-widest">/ Invoice</h3>
            <div className="mt-2 text-[10px] flex flex-col text-slate-600 font-medium">
              <p>NO: <span className="text-slate-900 font-bold ml-1">{invoiceNumber}</span></p>
              <p>TGL: <span className="text-slate-900 font-bold ml-1">{date}</span></p>
            </div>
          </div>
        </div>

        {/* Info Pelanggan & Pengiriman */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan</h4>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded print:border-none print:p-0 print:bg-transparent">
              <p className="font-bold text-slate-900 text-sm">{transaction.customerName || 'Anonim'}</p>
              <p className="text-[10px] text-slate-700">HP: <span className="font-semibold">{transaction.customerPhone || '-'}</span></p>
              <p className="text-[10px] text-slate-700 mt-1">Sales: <span className="font-semibold">{transaction.user.name || '-'}</span></p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Pengiriman</h4>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded h-full print:border-none print:p-0 print:bg-transparent">
              <p className="text-[10px] text-slate-900 font-medium">
                {transaction.shippingAddress || 'Diambil di tempat.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabel Barang */}
        <div className="mb-4">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white print:bg-slate-200 print:text-slate-900">
                <th className="py-1.5 px-2 font-bold">No.</th>
                <th className="py-1.5 px-2 font-bold">Deskripsi Barang</th>
                <th className="py-1.5 px-2 font-bold text-center">Qty</th>
                <th className="py-1.5 px-2 font-bold text-right">Harga</th>
                <th className="py-1.5 px-2 font-bold text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b">
              {transaction.items.map((item: any, index: number) => (
                <tr key={item.id}>
                  <td className="py-1.5 px-2 text-slate-500 font-medium">{index + 1}</td>
                  <td className="py-1.5 px-2">
                    <p className="font-bold text-slate-900">{item.product.name}</p>
                    <p className="text-[8px] text-slate-500 font-medium">SKU: {item.product.code}</p>
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-1.5 px-2 text-right text-slate-600">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-900">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-between items-end mb-4">
          <div className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200 print:border-none print:bg-transparent">
            * {title}
          </div>
          <div className="w-1/2 max-w-50">
            <div className="flex justify-between py-1 border-b border-slate-100 text-[10px]">
              <span className="text-slate-500 font-medium">Barang</span>
              <span className="text-slate-900 font-bold">Rp {totalItemAmount.toLocaleString('id-ID')}</span>
            </div>
            {shippingCost > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-[10px]">
                <span className="text-slate-500 font-medium">Ongkir</span>
                <span className="text-slate-900 font-bold">Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 text-xs border-b border-slate-900">
              <span className="text-slate-900 font-extrabold">TOTAL</span>
              <span className="text-slate-900 font-extrabold">Rp {totalKeseluruhan.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* Tanda Tangan */}
        <div className="grid grid-cols-3 gap-4 text-center text-[10px] font-medium text-slate-900">
          <div className="flex flex-col items-center">
            <p className="mb-8">Penerima,</p>
            <div className="w-24 border-b border-slate-400"></div>
            <p className="mt-1 text-[8px] text-slate-500 font-bold">{transaction.customerName || 'Nama Terang'}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="mb-8">Pengirim,</p>
            <div className="w-24 border-b border-slate-400"></div>
            <p className="mt-1 text-[8px] text-slate-500 font-bold">Ttd</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="mb-8">Hormat Kami,</p>
            <div className="w-24 border-b border-slate-400"></div>
            <p className="mt-1 text-[8px] text-slate-500 font-bold">Admin Multazam</p>
          </div>
        </div>
        
        {/* Catatan Bawah */}
        <div className="mt-4 pt-2 border-t border-slate-200 text-[8px] text-slate-400 text-center italic">
          Dokumen ini merupakan bukti pengiriman barang. Barang yang diterima tidak dapat ditukar/dikembalikan kecuali ada perjanjian sebelumnya.
        </div>
      </div>
    </div>
  );
}

export default async function PrintDeliveryOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        }
      }
    }
  });

  if (!transaction) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white flex flex-col items-center py-8 print:py-0">
      <div id="print-container" className="w-full max-w-[210mm] bg-white shadow-lg print:shadow-none mx-auto relative print:w-full">
        {/* Floating Print Button (Hidden on Print) */}
        <PrintButton invoiceNumber={transaction.invoiceNumber} />
        
        {/* Salinan Untuk Driver / Arsip */}
        <SuratJalanCopy transaction={transaction} title="Salinan Karyawan (Pengirim)" />
        
        {/* Salinan Untuk Kardus / Pelanggan */}
        <SuratJalanCopy transaction={transaction} title="Salinan Pelanggan (Tempel di Kardus)" hideCutLine={true} />
      </div>
    </div>
  );
}
