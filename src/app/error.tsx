'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCcw, AlertTriangle, Bug } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Global Application Error:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans w-full">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-900 mb-2 tracking-tight">Oops! Terjadi Kesalahan</h1>
          <p className="text-sm text-red-700/80 max-w-md">
            Sistem mengalami masalah saat memproses permintaan Anda. Kami mohon maaf atas ketidaknyamanan ini.
          </p>
        </div>

        {/* Detailed Error for Development ONLY */}
        {isDev && (
          <div className="p-6 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Mode Development</h3>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
              <p className="text-red-400 font-mono text-sm mb-2 font-bold">{error.name}: {error.message}</p>
              {error.stack && (
                <pre className="text-slate-400 font-mono text-[10px] leading-relaxed">
                  {error.stack}
                </pre>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              (Detail error ini hanya tampil di lingkungan <span className="font-bold">development</span>. Pengguna di production tidak akan melihat kode ini).
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex flex-col sm:flex-row gap-3 justify-center bg-white">
          <button
            onClick={() => reset()}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-sm text-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            Coba Lagi
          </button>
          
          <Link
            href="/"
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
