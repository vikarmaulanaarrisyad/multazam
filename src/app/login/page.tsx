"use client"

import React, { useState, useEffect } from 'react';
import { PackageSearch, ShieldCheck, Zap, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPublicSettings } from '@/actions/settings-actions';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<{ companyName: string; logoUrl: string | null }>({
    companyName: 'DIA MAKMUR ABADI',
    logoUrl: null,
  });
  const router = useRouter();

  useEffect(() => {
    getPublicSettings().then((data) => {
      if (data) setSettings(data);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError('Kredensial tidak valid. Silakan coba lagi.');
        setIsLoading(false);
      } else {
        router.push('/'); // Middleware will handle redirecting to correct dashboard
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
      
      {/* Left Section: Visual / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 flex-col justify-between p-12 overflow-hidden group">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-white to-primary/5 rounded-[3rem]" />
          <div className="absolute top-1/4 -right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2 pointer-events-none mb-12">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain rounded" />
          ) : (
            <PackageSearch className="text-primary w-8 h-8" />
          )}
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {settings.companyName}
          </span>
        </div>

        {/* Decorative Element */}
        <div className="absolute -top-12 -right-12 p-8 opacity-[0.03] z-0 pointer-events-none">
          <PackageSearch className="w-96 h-96 text-primary" />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
          <div>
            <div className="h-16 w-16 mb-6 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-200 text-primary">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">Portal Admin Aman</h1>
            <p className="text-lg text-slate-600 mt-4 leading-relaxed">
              Akses dashboard terpusat untuk mengelola operasi inventori, memantau tingkat stok, dan mengoordinasikan transaksi.
            </p>
          </div>
          
          <div className="space-y-6 mt-12">
            <div className="flex items-center gap-5 bg-white/60 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-slate-100/50">
              <div className="h-12 w-12 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Keamanan Enterprise</h3>
                <p className="text-sm text-slate-600 mt-1">Data logistik terenkripsi end-to-end.</p>
              </div>
            </div>
            <div className="flex items-center gap-5 bg-white/60 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-slate-100/50">
              <div className="h-12 w-12 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Sinkronisasi Real-time</h3>
                <p className="text-sm text-slate-600 mt-1">Pembaruan instan di seluruh fasilitas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info left */}
        <div className="relative z-10 mt-12">
          <p className="text-sm text-slate-500">
            Sistem Inventori {settings.companyName} © {new Date().getFullYear()}. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="flex-1 flex flex-col justify-center relative bg-white px-6 py-12 sm:px-12 md:px-20 lg:px-24 xl:px-32">
        
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10 absolute top-8 left-6 sm:left-12">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain rounded" />
          ) : (
            <PackageSearch className="text-primary w-8 h-8" />
          )}
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {settings.companyName}
          </span>
        </div>
        
        <div className="w-full max-w-md mx-auto -mt-10 lg:-mt-16">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-base text-slate-600 mt-2">Silakan masukkan kredensial Anda untuk melanjutkan.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email / Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="email">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="text-slate-400 w-5 h-5" />
                </div>
                <input 
                  className="block w-full pl-11 pr-4 py-3 h-12 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all sm:text-sm" 
                  id="email" 
                  name="email" 
                  placeholder="admin@edia.com" 
                  required 
                  type="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-900" htmlFor="password">Kata Sandi</label>
                <Link className="text-sm font-medium text-primary hover:text-primary/80 transition-colors" href="/forgot-password">Lupa Kata Sandi?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 w-5 h-5" />
                </div>
                <input 
                  className="block w-full pl-11 pr-11 py-3 h-12 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all sm:text-sm" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLoading}
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none transition-colors" 
                  onClick={() => setShowPassword(!showPassword)} 
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-2">
              <input 
                className="h-4 w-4 text-primary focus:ring-primary/50 border-slate-300 rounded cursor-pointer accent-primary" 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
              />
              <label className="ml-2.5 block text-sm text-slate-600 cursor-pointer select-none" htmlFor="remember-me">
                Ingat saya selama 30 hari
              </label>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all h-12 items-center disabled:opacity-75 disabled:cursor-not-allowed mt-4" 
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Mengautentikasi...' : 'Masuk ke Dashboard'}</span>
              {!isLoading && <ArrowRight className="ml-2.5 w-5 h-5" />}
            </button>
          </form>

          {/* Environment Indicator */}
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">
              {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} Env
            </span>
          </div>
          
          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
            <p className="text-xs text-slate-400">
              {settings.companyName} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
