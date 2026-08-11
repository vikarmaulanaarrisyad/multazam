import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintButton } from './_components/PrintButton';
import { Suspense } from 'react';
import { auth } from '@/auth';

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
  const match = product.retailPriceNote.match(/\d[\d.,]*/);
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
    <div style={{ fontFamily: 'Calibri, sans-serif' }} className={`w-full min-h-[14cm] print:min-h-0 bg-white p-4 print:px-[1.5cm] print:pt-[0.7cm] print:pb-[1cm] relative flex flex-col text-xs leading-tight text-slate-900 ${isDivider ? 'border-b-2 border-dashed border-slate-300 print:border-slate-400 pb-12 mb-12 print:pb-12 print:mb-12' : ''}`}>
      
      <div className="w-full">
        {/* HEADER SECTION */}
      <div className="flex justify-between w-full mb-2 uppercase font-semibold">
        {/* Kiri */}
        <div className="flex flex-col w-1/2">
          <span className="text-[22px] font-bold tracking-wider">{setting?.companyName || 'E - DIA MAKMUR ABADI'}</span>
          <span className="text-xs font-semibold tracking-wide">
            {transaction.notes?.includes('[Metode: COD]') || transaction.notes?.includes('[Metode: CASH]') || (!transaction.notes?.includes('[Metode: TEMPO]') && !transaction.notes?.includes('[Metode: TRANSFER]'))
              ? 'FAKTUR PENJUALAN TUNAI' 
              : 'FAKTUR PENJUALAN'}
          </span>
          
          <div className="flex mt-auto pt-6">
            <span className="w-24">TANGGAL</span>
            <span className="mr-6">:</span>
            <span>{date}</span>
          </div>
        </div>
        
        {/* Kanan */}
        <div className="flex flex-col w-[45%]">
          <div className="flex"><span className="w-24">NO</span><span className="mr-2">:</span><span>{invoiceNumber}</span></div>
          <div className="flex"><span className="w-24">Nama Toko</span><span className="mr-2">:</span><span>{transaction.customerName || '-'}</span></div>
          <div className="flex"><span className="w-24">Alamat</span><span className="mr-2">:</span><span className="truncate">{transaction.shippingAddress || '-'}</span></div>
          <div className="flex"><span className="w-24">Sales</span><span className="mr-2">:</span><span>{transaction.user?.name || '-'}</span></div>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full text-left uppercase border-collapse mt-1 text-[13px] font-semibold">
        <thead>
          <tr className="border-t-4 border-b border-double border-slate-900">
            <th className="py-1 px-1 font-semibold text-center w-12">NO</th>
            <th className="py-1 px-1 font-semibold w-32">KODE</th>
            <th className="py-1 px-1 font-semibold">NAMA PRODUK</th>
            <th className="py-1 px-1 font-semibold text-center w-16">QTY</th>
            <th className="py-1 px-1 font-semibold text-right w-36">HARGA</th>
            <th className="py-1 px-1 font-semibold text-right w-40">TOTAL</th>
          </tr>
        </thead>
        <tbody className="border-b border-slate-900">
          {transaction.items.map((item: any, index: number) => {
            // Determine Unit string
            let isEceran = false;
            const kartonPrice = Number(item.originalPrice || item.product.price);
            const eceranPrice = getEceranPrice(item.product);
            
            if (eceranPrice !== null) {
               // Exact match or if the price is much closer to eceran than karton
               if (Number(item.price) === eceranPrice) {
                 isEceran = true;
               } else if (Number(item.price) <= eceranPrice * 1.5) {
                 isEceran = true;
               }
            }

            let unitString = item.product.unit?.name || 'Dus';
            if (isEceran && item.product.retailPriceNote) {
               // Extract string unit from retailPriceNote (e.g. "BTL 15000" -> "BTL")
               const match = item.product.retailPriceNote.match(/[a-zA-Z]+/);
               if (match) {
                 unitString = match[0].toUpperCase();
               } else {
                 unitString = 'PCS';
               }
            }

            return (
              <tr key={item.id} className="break-inside-avoid">
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
             <tr className="break-inside-avoid">
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
      </div>
      
      <div className="mt-8">
      {/* FOOTER */}
      <div className="flex justify-between items-center py-1 uppercase text-xs font-semibold border-b-4 border-double border-slate-900 text-slate-900">
        <div className="flex flex-1 pl-12">
          <span className="w-24">TERBILANG</span>
          <span className="mx-2">:</span>
          <span className="truncate flex-1">{toTerbilang(totalKeseluruhan)}</span>
        </div>
        <div className="w-40 flex justify-between px-1">
          <span>Rp</span>
          <span>{totalKeseluruhan.toLocaleString('id-ID')},00</span>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="flex justify-center gap-48 mt-8 mb-2 uppercase text-center text-xs font-semibold text-slate-900">
        <div className="flex flex-col items-center w-40">
          <div className="w-full flex justify-between mb-8">
            <span>(</span>
            <span>)</span>
          </div>
          <p>Penerima</p>
        </div>
        <div className="flex flex-col items-center w-40">
          <div className="w-full flex justify-between mb-8">
            <span>(</span>
            <span>)</span>
          </div>
          <p>Pengirim</p>
        </div>
      </div>
      </div>
    </div>
  );
}

export default async function PrintDeliveryOrderPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const orientation = sp.orientation === 'landscape' ? 'landscape' : 'portrait';

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

  if (!transaction) {
    notFound();
  }

  const session = await auth();
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
        <p className="text-slate-500">Anda harus login untuk mencetak dokumen ini.</p>
      </div>
    );
  }

  const role = session.user.role;
  const isOwner = transaction.userId === session.user.id;
  
  if (role === 'SALES' && !isOwner) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
        <p className="text-slate-500">Anda hanya dapat mencetak faktur milik Anda sendiri.</p>
      </div>
    );
  }

  const setting = await prisma.setting.findUnique({
    where: { id: "1" }
  });

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white flex flex-col items-center p-8 print:p-0 w-full">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
          }
          * {
            -webkit-font-smoothing: none !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeSpeed !important;
            color: #000 !important;
          }
        }
      `}} />
      <div id="print-container" className={`w-full ${orientation === 'landscape' ? 'max-w-[21.5cm]' : 'max-w-[21cm]'} print:max-w-none shrink-0 bg-white relative print:w-full shadow-sm print:shadow-none p-4 print:p-0`}>
        {/* Floating Print Button (Hidden on Print) */}
        <Suspense fallback={<div />}>
          <PrintButton invoiceNumber={transaction.invoiceNumber} />
        </Suspense>
        
        {/* Salinan Tunggal (Karena kertas Bagi 2) */}
        <SuratJalanCopy transaction={transaction} setting={setting} isDivider={false} />
      </div>
    </div>
  );
}
