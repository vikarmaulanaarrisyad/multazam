import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
        <div className="h-4 w-96 bg-slate-200 rounded-lg"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Memuat Data Pesanan...</h2>
        <p className="text-slate-500 text-sm mt-1">Harap tunggu sebentar, sedang mengambil data dari server.</p>
      </div>
    </div>
  );
}
