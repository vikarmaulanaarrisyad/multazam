"use client"

import React, { useState, useEffect } from 'react';
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight, Fingerprint, PackageSearch } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPublicSettings } from '@/actions/settings-actions';

export default function SalesLoginPage() {
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
        router.push('/sales'); // Ensure redirect to sales dashboard
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl pt-safe border-b border-slate-200">
        <div className="h-16 px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
            ) : (
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <TrendingUp className="text-primary-foreground w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-lg tracking-tight text-slate-900">
              {settings.companyName}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center pt-16 px-4 bg-slate-50">
        <div className="flex flex-col w-full py-8 justify-center min-h-[calc(100vh-120px)] text-slate-900">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 overflow-hidden relative group">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300"></div>
              <PackageSearch className="w-12 h-12 text-primary z-10 drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">Selamat Datang</h1>
            <p className="text-sm text-slate-500 text-center max-w-70">Portal Sales Team terintegrasi untuk efisiensi operasional</p>
          </div>

          <form className="flex flex-col gap-5 w-full max-w-sm mx-auto bg-white p-6 rounded-2xl shadow-sm relative overflow-hidden border border-slate-200" id="login-form" onSubmit={handleLogin}>
            {/* Decorative background accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            
            {error && (
              <div className="p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200 relative z-10">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5 relative z-10">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5 ml-1" htmlFor="email">
                <Mail className="w-4 h-4" />
                Email atau Nomor Telepon
              </label>
              <div className="relative group">
                <input 
                  className="w-full h-12 bg-slate-50 text-slate-900 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200" 
                  id="email" 
                  name="email"
                  placeholder="Masukan data..." 
                  type="email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 relative z-10">
              <label className="text-sm font-medium text-slate-600 flex items-center justify-between ml-1 w-full" htmlFor="password">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  PIN / Password
                </div>
              </label>
              <div className="relative group">
                <input 
                  className="w-full h-12 bg-slate-50 text-slate-900 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200 tracking-widest" 
                  id="password" 
                  name="password"
                  placeholder="••••••" 
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                />
                <button 
                  aria-label="Toggle password visibility" 
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 transition-transform duration-200 hover:scale-110" /> : <Eye className="w-5 h-5 transition-transform duration-200 hover:scale-110" />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200" href="/forgot-password">Lupa Password?</Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 relative z-10">
              <button 
                className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? 'Memproses...' : 'Masuk'}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
              </button>
              
              <div className="flex items-center gap-4 my-2 opacity-60">
                <div className="h-px bg-slate-300 flex-1"></div>
                <span className="text-sm text-slate-500">atau</span>
                <div className="h-px bg-slate-300 flex-1"></div>
              </div>
              
              <button 
                className="w-full h-12 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors duration-200 flex items-center justify-center gap-2 group shadow-sm border border-slate-200 disabled:opacity-75" 
                type="button"
                disabled={isLoading}
              >
                <Fingerprint className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                Gunakan Biometrik
              </button>
            </div>
          </form>

          <div className="mt-8 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-1 bg-slate-300 rounded-full mb-2"></div>
            <p className="text-xs text-slate-500">Versi 1.0.0 (Build 001)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
