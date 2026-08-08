'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, UserCircle, MapPin, Phone, Send, AlertCircle } from 'lucide-react';
import { createStore } from '@/actions/store.action';
import { cn } from '@/lib/utils';

export function StoreRegistrationClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    address: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createStore(formData);
      
      if (result.success) {
        // Refresh to allow access to the pre-order form
        window.location.reload();
      } else {
        setError(result.error || 'Gagal menyimpan data toko');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Store className="text-blue-700 w-4 h-4" />
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">Pendaftaran Toko</span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6 max-w-md mx-auto w-full">
        <div className="rounded-xl p-4 bg-blue-50 border border-blue-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Lengkapi Profil Toko
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sebelum membuat pesanan pertama, Anda diwajibkan untuk melengkapi informasi toko Anda. Data ini hanya perlu diisi sekali.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-5">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor="name">
                <Store className="w-4 h-4 text-slate-400" />
                Nama Toko <span className="text-red-500">*</span>
              </label>
              <input 
                id="name"
                type="text" 
                required
                placeholder="Contoh: Toko Berkah Jaya"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor="ownerName">
                <UserCircle className="w-4 h-4 text-slate-400" />
                Nama Pemilik Toko <span className="text-red-500">*</span>
              </label>
              <input 
                id="ownerName"
                type="text" 
                required
                placeholder="Masukkan nama lengkap pemilik"
                value={formData.ownerName}
                onChange={e => setFormData({...formData, ownerName: e.target.value})}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor="phone">
                <Phone className="w-4 h-4 text-slate-400" />
                Nomor HP <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
              </label>
              <input 
                id="phone"
                type="tel" 
                placeholder="Contoh: 08123456789"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor="address">
                <MapPin className="w-4 h-4 text-slate-400" />
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea 
                id="address"
                required
                placeholder="Masukkan alamat lengkap toko..."
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full h-24 p-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all border"
              />
            </div>

          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 text-sm mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Simpan & Lanjutkan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
