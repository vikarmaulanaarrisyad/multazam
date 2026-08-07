'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="absolute top-0 right-0 m-8 print:hidden flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-colors hover:scale-105 active:scale-95"
    >
      <Printer className="w-5 h-5" /> Cetak Dokumen
    </button>
  );
}
