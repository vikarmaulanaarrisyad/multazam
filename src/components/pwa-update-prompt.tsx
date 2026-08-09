'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X, ArrowUpCircle } from 'lucide-react';

export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Ada update baru yang sudah selesai didownload
                setNeedRefresh(true);
                setSwRegistration(registration);
              }
            });
          }
        });
      });
      
      // Jika SW sudah waiting sejak awal dimuat (misal user sebelumnya menolak update / ignore)
      navigator.serviceWorker.getRegistration().then(reg => {
          if (reg?.waiting) {
              setNeedRefresh(true);
              setSwRegistration(reg);
          }
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (swRegistration && swRegistration.waiting) {
      setIsUpdating(true); // Memulai animasi loading
      
      // Berikan jeda sedikit agar user bisa melihat animasi "Sedang Memperbarui..."
      setTimeout(() => {
        // Mengirimkan pesan untuk memaksa SW baru mengambil alih
        swRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        
        // Memberi sedikit waktu agar SW baru aktif sebelum reload
        setTimeout(() => {
            window.location.reload();
        }, 500);
      }, 800); // 800ms animasi buatan
    }
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-96 z-70 animate-in slide-in-from-bottom-10 fade-in duration-500 ease-out pb-safe md:pb-0">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-4 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Tutup Notifikasi"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4 items-center pl-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 shadow-inner">
            <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
          </div>
          
          <div className="flex flex-col flex-1 pr-4">
            <h3 className="text-[15px] font-extrabold text-slate-900 leading-tight">Pembaruan Tersedia</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Versi baru aplikasi telah siap. Muat ulang sekarang untuk mendapatkan fitur terbaru.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 pl-2">
          <button 
            onClick={updateServiceWorker}
            disabled={isUpdating}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-wait"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Sedang Memperbarui...' : 'Update & Muat Ulang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
