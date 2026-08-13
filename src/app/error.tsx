'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="relative w-72 h-72 mb-6">
        <Image 
          src="/images/500.jpg" 
          alt="500 Internal Server Error Illustration" 
          fill
          className="object-contain"
          priority
        />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">500</h1>
      <h2 className="text-xl font-bold text-slate-800 mb-3">Terjadi Kesalahan Sistem</h2>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed text-sm">
        Maaf, ada masalah di server kami yang menyebabkan halaman gagal dimuat. Tim kami telah diberitahu dan sedang memperbaikinya.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw className="w-5 h-5" />
          Coba Lagi
        </button>
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
        >
          <Home className="w-5 h-5" />
          Beranda
        </Link>
      </div>
    </div>
  );
}
