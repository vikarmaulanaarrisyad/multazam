import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintButton } from './_components/PrintButton';

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

  const invoiceNumber = transaction.invoiceNumber;
  const date = new Date(transaction.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalItemAmount = transaction.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const shippingCost = Number(transaction.shippingCost) || 0;
  const totalKeseluruhan = totalItemAmount + shippingCost;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white flex flex-col items-center py-8 print:py-0">
      
      <div className="w-full max-w-[210mm] bg-white p-12 print:p-0 shadow-lg print:shadow-none mx-auto relative print:w-full">
        
        {/* Floating Print Button (Hidden on Print) */}
        <PrintButton />

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">MULTAZAM</h1>
            <p className="text-slate-600 font-medium text-sm mt-1">Sistem Penjualan & Inventori Terpercaya</p>
            <p className="text-slate-500 text-xs mt-1">Jl. Contoh Alamat No. 123, Kota, Provinsi, 12345</p>
            <p className="text-slate-500 text-xs">Telp: 0812-3456-7890</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">Surat Jalan</h2>
            <h3 className="text-lg font-semibold text-slate-600 uppercase tracking-widest mt-1">/ Invoice</h3>
            <div className="mt-4 text-sm flex flex-col gap-1 text-slate-600 font-medium">
              <p>NO: <span className="text-slate-900 font-bold ml-2">{invoiceNumber}</span></p>
              <p>TGL: <span className="text-slate-900 font-bold ml-2">{date}</span></p>
            </div>
          </div>
        </div>

        {/* Info Pelanggan & Pengiriman */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Pelanggan</h4>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg print:border-none print:p-0 print:bg-transparent">
              <p className="font-bold text-slate-900 text-lg mb-1">{transaction.customerName || 'Anonim'}</p>
              <p className="text-sm text-slate-700">No. HP: <span className="font-semibold">{transaction.customerPhone || '-'}</span></p>
              <p className="text-sm text-slate-700 mt-2">Sales/Admin: <span className="font-semibold">{transaction.user.name || '-'}</span></p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Pengiriman</h4>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg h-full print:border-none print:p-0 print:bg-transparent">
              <p className="text-sm text-slate-900 font-medium leading-relaxed">
                {transaction.shippingAddress || 'Diambil di tempat / Tidak ada alamat pengiriman.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabel Barang */}
        <div className="mb-8">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white print:bg-slate-200 print:text-slate-900">
                <th className="py-3 px-4 font-bold rounded-tl-lg print:rounded-none">No.</th>
                <th className="py-3 px-4 font-bold">Deskripsi Barang</th>
                <th className="py-3 px-4 font-bold text-center">Kuantitas</th>
                <th className="py-3 px-4 font-bold text-right">Harga Satuan</th>
                <th className="py-3 px-4 font-bold text-right rounded-tr-lg print:rounded-none">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b">
              {transaction.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-4 px-4 text-slate-500 font-medium">{index + 1}</td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">{item.product.name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">SKU: {item.product.code}</p>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-4 px-4 text-right text-slate-600">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-1/2">
            <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Total Harga Barang</span>
              <span className="text-slate-900 font-bold">Rp {totalItemAmount.toLocaleString('id-ID')}</span>
            </div>
            {shippingCost > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">Biaya Pengiriman</span>
                <span className="text-slate-900 font-bold">Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between py-4 text-lg border-b-2 border-slate-900">
              <span className="text-slate-900 font-extrabold">TOTAL KESELURUHAN</span>
              <span className="text-blue-700 print:text-slate-900 font-extrabold">Rp {totalKeseluruhan.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-8 text-center text-sm font-medium text-slate-900">
          <div className="flex flex-col items-center">
            <p className="mb-20">Penerima / Pelanggan,</p>
            <div className="w-40 border-b border-slate-400"></div>
            <p className="mt-2 text-xs text-slate-500 font-bold">{transaction.customerName || 'Nama Terang'}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="mb-20">Pengirim / Kurir,</p>
            <div className="w-40 border-b border-slate-400"></div>
            <p className="mt-2 text-xs text-slate-500 font-bold">Nama Terang / Ttd</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="mb-20">Hormat Kami,</p>
            <div className="w-40 border-b border-slate-400"></div>
            <p className="mt-2 text-xs text-slate-500 font-bold">Admin Multazam</p>
          </div>
        </div>
        
        {/* Catatan Bawah */}
        <div className="mt-16 pt-6 border-t border-slate-200 text-xs text-slate-400 text-center italic">
          Dokumen ini merupakan bukti pengiriman barang yang sah. Barang yang sudah dibeli dan diterima dengan baik tidak dapat ditukar atau dikembalikan kecuali ada perjanjian sebelumnya.
        </div>
        
      </div>
    </div>
  );
}
