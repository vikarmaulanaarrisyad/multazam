"use client"

import React, { useState } from 'react';
import { PackageSearch, ShieldCheck, Zap, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
    <div className="bg-slate-50 text-slate-900 h-screen overflow-hidden flex flex-col font-sans">
      <header className="p-8 flex items-center justify-start pointer-events-none">
        <div className="flex items-center gap-2">
          <PackageSearch className="text-primary w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight">
            MULTA<span className="text-primary">ZAM</span>
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
                    <PackageSearch className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Portal Admin Aman</h1>
                  <p className="text-base text-slate-600 mt-2 max-w-md">
                    Akses dashboard terpusat untuk mengelola operasi inventori, memantau tingkat stok, dan mengoordinasikan transaksi.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/60 backdrop-blur p-4 rounded-lg shadow-sm border border-white/40">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Keamanan Enterprise</h3>
                      <p className="text-xs text-slate-600">Data logistik terenkripsi end-to-end.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/60 backdrop-blur p-4 rounded-lg shadow-sm border border-white/40">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Sinkronisasi Real-time</h3>
                      <p className="text-xs text-slate-600">Pembaruan instan di seluruh fasilitas.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Login Form */}
            <div className="flex-1 flex flex-col justify-center px-4 py-8 md:px-8 lg:px-[10%] bg-white relative">
              <div className="w-full max-w-md mx-auto relative z-10">
                <div className="md:hidden flex items-center gap-2 mb-8">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white shadow-sm border text-primary">
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Multazam</h2>
                </div>
                
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Selamat Datang</h2>
                  <p className="text-sm text-slate-600 mt-1">Silakan masukkan kredensial Anda untuk melanjutkan.</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleLogin}>
                  {/* Email / Username */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5" htmlFor="email">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="text-slate-400 w-5 h-5" />
                      </div>
                      <input 
                        className="block w-full pl-10 pr-3 py-2 h-10 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-shadow" 
                        id="email" 
                        name="email" 
                        placeholder="admin@multazam.com" 
                        required 
                        type="email"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-semibold text-slate-900" htmlFor="password">Kata Sandi</label>
                      <a className="text-xs font-medium text-primary hover:text-primary/80 transition-colors" href="#">Lupa Kata Sandi?</a>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="text-slate-400 w-5 h-5" />
                      </div>
                      <input 
                        className="block w-full pl-10 pr-10 py-2 h-10 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-shadow" 
                        id="password" 
                        name="password" 
                        placeholder="••••••••" 
                        required 
                        type={showPassword ? 'text' : 'password'}
                        disabled={isLoading}
                      />
                      <button 
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors" 
                        onClick={() => setShowPassword(!showPassword)} 
                        type="button"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <input 
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer accent-primary" 
                      id="remember-me" 
                      name="remember-me" 
                      type="checkbox" 
                    />
                    <label className="ml-2 block text-sm text-slate-900 cursor-pointer" htmlFor="remember-me">
                      Ingat saya selama 30 hari
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button 
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-10 items-center disabled:opacity-75 disabled:cursor-not-allowed" 
                    type="submit"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? 'Mengautentikasi...' : 'Masuk ke Dashboard'}</span>
                    {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </button>
                </form>

                {/* Environment Indicator */}
                <div className="mt-8 flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} Environment Active
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                <p className="text-xs text-slate-500">
                  Sistem Inventori Multazam © {new Date().getFullYear()}. Hak Cipta Dilindungi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
