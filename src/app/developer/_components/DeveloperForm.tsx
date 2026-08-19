"use client";

import React, { useState } from 'react';
import { updateDeveloperSettings } from '@/actions/developer-actions';
import { toast } from 'sonner';

export default function DeveloperForm({ setting }: { setting: any }) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const res = await updateDeveloperSettings(formData);
      
      if (res.success) {
        toast.success("Pengaturan berhasil disimpan");
      } else {
        toast.error(res.error || "Gagal menyimpan pengaturan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsPending(false);
    }
  };

  const formattedDate = setting.trialExpiresAt 
    ? new Date(setting.trialExpiresAt).toISOString().slice(0, 16) 
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Pengaturan Trial */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">1. Pengaturan Masa Percobaan (Trial)</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input 
              type="checkbox" 
              name="trialActive" 
              defaultChecked={setting.trialActive} 
              className="w-5 h-5 accent-primary"
            />
            <span className="font-medium text-slate-900">Aktifkan Masa Trial</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Batas Waktu Trial</label>
            <input 
              type="datetime-local" 
              name="trialExpiresAt" 
              defaultValue={formattedDate}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900" 
            />
            <p className="text-xs text-slate-500 mt-1">Jika masa trial aktif dan waktu ini terlewati, pengguna (selain DEVELOPER) tidak akan bisa login.</p>
          </div>
        </div>
      </div>

      {/* Pengaturan Notifikasi Modal Global */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">2. Pengaturan Notifikasi Global (Modal)</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input 
              type="checkbox" 
              name="showDeveloperModal" 
              defaultChecked={setting.showDeveloperModal} 
              className="w-5 h-5 accent-primary"
            />
            <span className="font-medium text-slate-900">Tampilkan Modal Notifikasi Global</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Notifikasi</label>
            <input 
              type="text" 
              name="developerModalTitle" 
              defaultValue={setting.developerModalTitle || ""}
              placeholder="Contoh: Fitur Prabayar Gratis"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Isi Pesan / Konten</label>
            <textarea 
              name="developerModalContent" 
              defaultValue={setting.developerModalContent || ""}
              rows={5}
              placeholder="Contoh: Masa percobaan Anda hampir habis. Silakan hubungi admin untuk memperpanjang langganan..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900" 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

    </form>
  );
}
