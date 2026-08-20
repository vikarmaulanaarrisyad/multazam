"use client"

import React, { useState, useEffect } from 'react';
import { PackageSearch, ShieldCheck, Zap, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '@/actions/auth';
import Link from 'next/link';
import { getPublicSettings } from '@/actions/settings-actions';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<{ companyName: string; logoUrl: string | null }>({
    companyName: 'DIA MAKMUR ABADI',
    logoUrl: null,
  });

  useEffect(() => {
    getPublicSettings().then((data) => {
      if (data) setSettings(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const res = await forgotPassword(email);

    if (res.success) {
      setMessage(res.message);
    } else {
      setError(res.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-slate-50 text-slate-900 h-screen overflow-hidden flex flex-col font-sans">
      <header className="p-8 flex items-center justify-start pointer-events-none">
        <div className="flex items-center gap-2">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain rounded" />
          ) : (
            <PackageSearch className="text-primary w-8 h-8" />
          )}
          <span className="text-2xl font-bold tracking-tight">
            {settings.companyName}
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="flex flex-col w-full h-full max-h-200 max-w-6xl">
          <div className="flex flex-col md:flex-row flex-1 w-full bg-slate-50 overflow-hidden rounded-xl shadow-md border border-slate-200">
            
            {/* Left Section: Visual / Branding */}
            <div className="hidden md:flex md:w-1/2 relative bg-slate-100 flex-col justify-between p-8 overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent z-0"></div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 p-8 opacity-10 z-0">
                <PackageSearch className="w-30 h-30 text-primary" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="h-16 w-16 mb-4 rounded-xl flex items-center justify-center bg-white shadow-sm border text-primary">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Keamanan Terjamin</h1>
                  <p className="text-base text-slate-600 mt-2 max-w-md">
                    Jika Anda lupa kata sandi, jangan khawatir. Kami akan mengirimkan tautan aman untuk mereset kata sandi Anda.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/60 backdrop-blur p-4 rounded-lg shadow-sm border border-white/40">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Proses Cepat</h3>
                      <p className="text-xs text-slate-600">Terima tautan dalam hitungan detik.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Form */}
            <div className="flex-1 flex flex-col justify-center px-4 py-8 md:px-8 lg:px-[10%] bg-white relative">
              <div className="w-full max-w-md mx-auto relative z-10">
                <div className="md:hidden flex items-center gap-2 mb-8">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white shadow-sm border text-primary">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded" />
                    ) : (
                      <PackageSearch className="w-6 h-6" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{settings.companyName}</h2>
                </div>
                
                <div className="mb-8">
                  <Link href="/login" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Kembali ke Login
                  </Link>
                  <h2 className="text-2xl font-bold text-slate-900">Lupa Kata Sandi</h2>
                  <p className="text-sm text-slate-600 mt-1">Masukkan email terdaftar Anda untuk menerima tautan reset.</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                    {message}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5" htmlFor="email">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="text-slate-400 w-5 h-5" />
                      </div>
                      <input 
                        className="block w-full pl-10 pr-3 py-2 h-10 border border-slate-300 rounded-md leading-5 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-shadow" 
                        id="email" 
                        name="email" 
                        placeholder="admin@edia.com" 
                        required 
                        type="email"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-10 items-center disabled:opacity-75 disabled:cursor-not-allowed" 
                    type="submit"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}</span>
                    {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </button>
                </form>
              </div>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                <p className="text-xs text-slate-500">
                  Sistem Inventori {settings.companyName} © {new Date().getFullYear()}. Hak Cipta Dilindungi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
