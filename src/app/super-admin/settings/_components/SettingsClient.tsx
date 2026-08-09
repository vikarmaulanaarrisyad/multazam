'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { updateSettings, removeLogo } from '@/actions/settings-actions';
import { Upload, X, Save, Building2, MapPin } from 'lucide-react';
import Image from 'next/image';

export function SettingsClient({ initialSetting }: { initialSetting: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSetting?.logoUrl || null);
  const [file, setFile] = useState<File | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 2MB');
        return;
      }
      setFile(selectedFile);
      setLogoPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveLogo = async () => {
    setFile(null);
    setLogoPreview(null);
    
    // If it's saved in DB, remove it from DB and Cloudinary
    if (initialSetting?.logoUrl) {
      toast.promise(removeLogo(), {
        loading: 'Menghapus logo...',
        success: 'Logo berhasil dihapus',
        error: 'Gagal menghapus logo'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      if (file) {
        formData.set('logoFile', file);
      }
      
      const result = await updateSettings(formData);
      
      if (result.success) {
        toast.success('Pengaturan berhasil disimpan');
      } else {
        toast.error(result.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Identitas Perusahaan</h2>
      </div>
      
      <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Logo Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">Logo Perusahaan</label>
          <div className="flex items-start gap-6">
            <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden group">
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={handleRemoveLogo} className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition-transform">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Upload Logo</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <input
                type="file"
                id="logo-upload"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
              <label 
                htmlFor="logo-upload"
                className="inline-flex px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Pilih Gambar
              </label>
              <p className="text-xs text-slate-500">
                Format yang didukung: JPG, PNG, WEBP. Maksimal 2MB.
                <br />Logo ini akan ditampilkan pada cetakan Surat Jalan.
              </p>
            </div>
          </div>
        </div>
        
        <hr className="border-slate-100" />
        
        {/* Texts */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Perusahaan</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="companyName"
                defaultValue={initialSetting?.companyName}
                required
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 sm:text-sm"
                placeholder="Contoh: PT. DIA MAKMUR ABADI Maju Bersama"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Perusahaan</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <textarea
                name="companyAddress"
                defaultValue={initialSetting?.companyAddress}
                required
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 sm:text-sm"
                placeholder="Alamat lengkap yang akan dicetak di kop surat..."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titik Lokasi (Latitude)</label>
              <input
                type="number"
                step="any"
                name="officeLat"
                defaultValue={initialSetting?.officeLat || ''}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 sm:text-sm"
                placeholder="-6.200000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titik Lokasi (Longitude)</label>
              <input
                type="number"
                step="any"
                name="officeLng"
                defaultValue={initialSetting?.officeLng || ''}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 sm:text-sm"
                placeholder="106.816666"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}
