import React from 'react';
import Link from 'next/link';
import { ChevronLeft, MessageCircle, Phone, Mail, FileText } from 'lucide-react';

export const metadata = {
  title: 'Bantuan & Dukungan - DIA MAKMUR ABADI',
};

export default function SupportPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 font-sans pb-20">
      {/* HEADER */}
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <Link href="/sales/profile" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </Link>
        <h1 className="text-lg font-bold text-slate-800 ml-2">Bantuan & Dukungan</h1>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-linear-to-br from-primary to-blue-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
          
          <h2 className="text-xl font-extrabold relative z-10">Butuh Bantuan?</h2>
          <p className="text-blue-100 mt-1 text-sm font-medium relative z-10">
            Tim operasional dan IT kami siap membantu kendala Anda di lapangan.
          </p>
          
          <div className="mt-5 relative z-10">
            <a 
              href="https://wa.me/6281234567890?text=Halo%20Admin%20DIA%20MAKMUR%20ABADI,%20saya%20butuh%20bantuan%20terkait%20aplikasi%20Sales." 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-white text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95 shadow-sm"
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span>Hubungi Admin (WhatsApp)</span>
            </a>
          </div>
        </div>

        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2 mt-8">FAQ (Pertanyaan Umum)</h3>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <details className="group border-b border-slate-100 last:border-0">
            <summary className="flex items-center justify-between p-4 font-bold text-sm text-slate-800 cursor-pointer list-none hover:bg-slate-50">
              <span>Bagaimana jika GPS lokasi kunjungan tidak akurat?</span>
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="text-slate-500 mt-1 px-4 pb-4 text-[13px] font-medium leading-relaxed">
              Pastikan pengaturan lokasi (GPS) di HP Anda menyala dengan mode "Akurasi Tinggi". Coba matikan dan hidupkan kembali lokasi, atau refresh aplikasi.
            </p>
          </details>

          <details className="group border-b border-slate-100 last:border-0">
            <summary className="flex items-center justify-between p-4 font-bold text-sm text-slate-800 cursor-pointer list-none hover:bg-slate-50">
              <span>Apakah aplikasi ini memakan kuota besar?</span>
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="text-slate-500 mt-1 px-4 pb-4 text-[13px] font-medium leading-relaxed">
              Tidak. Aplikasi dirancang sebagai PWA yang sangat hemat data, caching pintar akan meminimalkan penggunaan data internet seluler Anda.
            </p>
          </details>

          <details className="group border-b border-slate-100 last:border-0">
            <summary className="flex items-center justify-between p-4 font-bold text-sm text-slate-800 cursor-pointer list-none hover:bg-slate-50">
              <span>Bagaimana cara melakukan reset kata sandi?</span>
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="text-slate-500 mt-1 px-4 pb-4 text-[13px] font-medium leading-relaxed">
              Jika Anda bisa login, ganti di menu <b>Edit Profile</b>. Jika lupa dan tidak bisa login, segera hubungi Admin melalui tombol WhatsApp di atas.
            </p>
          </details>
        </div>

        <div className="mt-8 bg-slate-100 rounded-2xl p-5 flex items-center justify-center border border-slate-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Versi Aplikasi</p>
            <p className="text-xs font-medium text-slate-500">v1.2.0 (Build 2026)</p>
          </div>
        </div>

      </div>
    </div>
  );
}
