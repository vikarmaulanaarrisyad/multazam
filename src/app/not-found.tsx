import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="relative w-72 h-72 mb-6">
        <Image 
          src="/images/404.jpg" 
          alt="404 Not Found Illustration" 
          fill
          className="object-contain"
          priority
        />
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
