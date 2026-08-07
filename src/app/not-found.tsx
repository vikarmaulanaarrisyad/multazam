import Link from 'next/link';
import { Home, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-200">
        <SearchX className="w-12 h-12 text-blue-600" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mb-3">Halaman Tidak Ditemukan</h2>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed text-sm">
        Maaf, halaman yang Anda cari mungkin telah dihapus, dipindahkan, atau Anda salah memasukkan URL.
      </p>
      
      <Link 
        href="/"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
      >
        <Home className="w-5 h-5" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}
