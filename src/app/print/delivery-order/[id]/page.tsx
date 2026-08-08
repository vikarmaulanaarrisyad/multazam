import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintButton } from './_components/PrintButton';
import { Suspense } from 'react';

// Terbilang helper function
function terbilang(angka: number): string {
  const huruf = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  let result = "";
  if (angka < 12) {
    result = " " + huruf[angka];
  } else if (angka < 20) {
    result = terbilang(angka - 10) + " belas";
  } else if (angka < 100) {
    result = terbilang(Math.floor(angka / 10)) + " puluh" + terbilang(angka % 10);
  } else if (angka < 200) {
    result = " seratus" + terbilang(angka - 100);
  } else if (angka < 1000) {
    result = terbilang(Math.floor(angka / 100)) + " ratus" + terbilang(angka % 100);
  } else if (angka < 2000) {
    result = " seribu" + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    result = terbilang(Math.floor(angka / 1000)) + " ribu" + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    result = terbilang(Math.floor(angka / 1000000)) + " juta" + terbilang(angka % 1000000);
  } else if (angka < 1000000000000) {
    result = terbilang(Math.floor(angka / 1000000000)) + " miliar" + terbilang(angka % 1000000000);
  }
  return result;
}

function toTerbilang(angka: number): string {
  if (angka === 0) return "Nol Rupiah";
  const str = terbilang(angka).trim();
  return str.charAt(0).toUpperCase() + str.slice(1) + " Rupiah";
}

const getEceranPrice = (product: any): number | null => {
  if (!product?.retailPriceNote) return null;
  const match = product.retailPriceNote.match(/[\d.,]+/);
  if (match) {
    const rawNum = match[0].replace(/[.,]/g, '');
    const num = parseInt(rawNum, 10);
    if (!isNaN(num)) return num;
  }
  return null;
};

function SuratJalanCopy({ transaction, setting, isDivider = false }: any) {
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
    <div className={`w-full bg-white print:p-0 relative flex flex-col font-mono text-sm leading-tight text-black ${isDivider ? 'border-b-2 border-dashed border-slate-300 print:border-slate-400 pb-12 mb-12 print:pb-12 print:mb-12' : ''}`} style={{ width: '210mm' }}>
      
      {/* HEADER SECTION */}
      <div className="flex justify-between w-full mb-4 uppercase">
        {/* Kiri */}
        <div className="flex flex-col font-bold">
          <span className="text-xl tracking-widest">{setting?.companyName || 'E - DIA MAKMUR ABADI'}</span>
          <span className="text-base tracking-wide mt-1">FAKTUR PENJUALAN TUNAI</span>
        </div>
        
        {/* Kanan */}
        <div className="flex flex-col whitespace-pre text-sm">
          <div className="flex"><span className="w-24">NO</span><span>: {invoiceNumber}</span></div>
          <div className="flex"><span className="w-24">Nama Toko</span><span>: {transaction.customerName || '-'}</span></div>
          <div className="flex"><span className="w-24">Alamat</span><span className="truncate max-w-64">: {transaction.shippingAddress || '-'}</span></div>
          <div className="flex"><span className="w-24">Sales</span><span>: {transaction.user?.name || '-'}</span></div>
        </div>
      </div>

      <div className="flex mb-2 uppercase text-sm font-semibold">
        <span className="w-24">TANGGAL</span><span>: {date}</span>
      </div>

      {/* TABLE */}
      <table className="w-full text-left uppercase border-collapse mt-2 text-sm">
        <thead className="border-y-2 border-black">
          <tr>
            <th className="py-1 px-1 font-normal text-center w-12">NO</th>
            <th className="py-1 px-1 font-normal w-32">KODE</th>
            <th className="py-1 px-1 font-normal">NAMA PRODUK</th>
            <th className="py-1 px-1 font-normal text-center w-16">QTY</th>
            <th className="py-1 px-1 font-normal text-right w-40">HARGA</th>
            <th className="py-1 px-1 font-normal text-right w-40">TOTAL</th>
          </tr>
        </thead>
        <tbody className="border-b-2 border-black">
          {transaction.items.map((item: any, index: number) => {
            // Determine Unit string
            let unitString = item.product.unit?.name || '';
            const eceranPrice = getEceranPrice(item.product);
            if (eceranPrice !== null && Number(item.price) === eceranPrice) {
               // Extract string unit from retailPriceNote (e.g. "BTL 15000" -> "BTL")
               const match = item.product.retailPriceNote.match(/[a-zA-Z]+/);
               if (match) {
                 unitString = match[0].toUpperCase();
               }
            }

            return (
              <tr key={item.id}>
                <td className="py-1 px-1 text-center align-top">{index + 1}</td>
                <td className="py-1 px-1 align-top">{item.product.code}</td>
                <td className="py-1 px-1 align-top">{item.product.name}</td>
                <td className="py-1 px-1 text-center align-top whitespace-nowrap">{item.quantity} {unitString}</td>
                <td className="py-1 px-1 text-right align-top">
                  <div className="flex justify-between w-full pl-4">
                    <span>Rp</span>
                    <span>{Number(item.price).toLocaleString('id-ID')},00</span>
                  </div>
                </td>
                <td className="py-1 px-1 text-right align-top">
                  <div className="flex justify-between w-full pl-4">
                    <span>Rp</span>
                    <span>{(Number(item.price) * item.quantity).toLocaleString('id-ID')},00</span>
                  </div>
                </td>
              </tr>
            );
          })}
          {shippingCost > 0 && (
             <tr>
              <td className="py-1 px-1 text-center align-top"></td>
              <td className="py-1 px-1 align-top"></td>
              <td className="py-1 px-1 align-top">BIAYA ONGKIR PENGIRIMAN</td>
              <td className="py-1 px-1 text-center align-top">1</td>
              <td className="py-1 px-1 text-right align-top">
                <div className="flex justify-between w-full pl-4">
                  <span>Rp</span>
                  <span>{shippingCost.toLocaleString('id-ID')},00</span>
                </div>
              </td>
              <td className="py-1 px-1 text-right align-top">
                <div className="flex justify-between w-full pl-4">
                  <span>Rp</span>
                  <span>{shippingCost.toLocaleString('id-ID')},00</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* FOOTER */}
      <div className="flex justify-between mt-2 mb-8 uppercase text-sm">
        <div className="flex gap-2 font-medium">
          <span className="w-24">TERBILANG</span>
          <span className="w-96">: {toTerbilang(totalKeseluruhan)}</span>
        </div>
        <div className="flex gap-4">
          <div className="w-40 flex justify-between font-bold border-b border-black">
            <span className="pl-4">Rp</span>
            <span>{totalKeseluruhan.toLocaleString('id-ID')},00</span>
          </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="flex justify-around mt-8 uppercase text-center w-2/3 self-center text-sm font-semibold">
        <div className="flex flex-col items-center">
          <p className="mb-14">( ________________________ )</p>
          <p>Penerima</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="mb-14">( ________________________ )</p>
          <p>Pengirim</p>
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
          product: {
            include: { unit: true }
          },
        }
      }
    }
  });

  const setting = await prisma.setting.findUnique({
    where: { id: "1" }
  });

  if (!transaction) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white print:bg-white flex flex-col items-start p-8 print:p-0">
      <div id="print-container" className="w-[210mm] shrink-0 bg-white relative print:w-[210mm]">
        {/* Floating Print Button (Hidden on Print) */}
        <Suspense fallback={<div />}>
          <PrintButton invoiceNumber={transaction.invoiceNumber} />
        </Suspense>
        
        {/* Salinan Atas */}
        <SuratJalanCopy transaction={transaction} setting={setting} isDivider={true} />
        
        {/* Salinan Bawah */}
        <SuratJalanCopy transaction={transaction} setting={setting} isDivider={false} />
      </div>
    </div>
  );
}
