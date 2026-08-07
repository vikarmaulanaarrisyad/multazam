'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      return;
    }

    // Check if dismissed before in session storage
    const isDismissed = sessionStorage.getItem('pwaPromptDismissed');
    if (isDismissed) {
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback for iOS/Safari or browsers that don't support beforeinstallprompt yet
    // Show a generic install instruction after a few seconds if not standalone
    const timer = setTimeout(() => {
      if (!isStandalone && !isDismissed && !deferredPrompt && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback message for iOS (Add to Home Screen)
      alert('Untuk menginstal di iOS (iPhone/iPad): \n\n1. Tap ikon "Share" (kotak dengan panah ke atas) di menu bawah Safari.\n2. Gulir ke bawah dan pilih "Add to Home Screen" (Tambahkan ke Layar Utama).');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-500 ease-out pb-safe">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-4 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4 items-center pl-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 shadow-inner">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex flex-col flex-1 pr-4">
            <h3 className="text-[15px] font-extrabold text-slate-900 leading-tight">Install Aplikasi Multazam</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Dapatkan pengalaman lebih cepat, akses offline, dan tampilan penuh selayaknya aplikasi native.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 pl-2">
          <button 
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors active:scale-95 shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Install Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
