'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <div className="absolute top-0 right-0 m-8 print:hidden flex items-center gap-4">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-xl font-bold border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors hover:scale-105 active:scale-95"
      >
        Kembali
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-colors hover:scale-105 active:scale-95"
      >
        <Printer className="w-5 h-5" /> Cetak Dokumen
      </button>
    </div>
  );
}
