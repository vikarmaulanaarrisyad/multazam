"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { PackageSearch, ShieldCheck, Zap, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/actions/auth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Token tidak valid atau tidak ditemukan. Silakan minta tautan reset yang baru.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!token) {
      setError('Token tidak valid. Silakan minta tautan reset yang baru.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok. Pastikan Anda mengetik kata sandi yang sama.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi harus terdiri dari minimal 6 karakter.');
      setIsLoading(false);
      return;
    }

    const res = await resetPassword(token, password);

    if (res.success) {
      setMessage(res.message);
      // Optional: automatically redirect to login after a few seconds
    } else {
      setError(res.message);
    }
    
    setIsLoading(false);
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
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Buat Kata Sandi Baru</h1>
                  <p className="text-base text-slate-600 mt-2 max-w-md">
                    Pastikan kata sandi baru Anda kuat dan mudah diingat. Gunakan kombinasi huruf, angka, dan simbol.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/60 backdrop-blur p-4 rounded-lg shadow-sm border border-white/40">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Enkripsi Kuat</h3>
                      <p className="text-xs text-slate-600">Kata sandi Anda akan dienkripsi dengan aman.</p>
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
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">DIA MAKMUR ABADI</h2>
                </div>
                
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Reset Kata Sandi</h2>
                  <p className="text-sm text-slate-600 mt-1">Silakan masukkan kata sandi baru Anda.</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
                    {error}
                  </div>
                )}
                
                {message ? (
                  <div className="text-center">
                    <div className="mb-6 p-4 rounded bg-emerald-50 text-emerald-700 text-sm border border-emerald-200 flex flex-col items-center gap-2">
                      <ShieldCheck className="w-8 h-8" />
                      <p className="font-semibold">{message}</p>
                    </div>
                    <Link href="/login" className="inline-flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors">
                      Kembali ke Login
                    </Link>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1.5" htmlFor="password">Kata Sandi Baru</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="text-slate-400 w-5 h-5" />
                        </div>
                        <input 
                          className="block w-full pl-10 pr-3 py-2 h-10 border border-slate-300 rounded-md leading-5 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-shadow" 
                          id="password" 
                          name="password" 
                          placeholder="••••••••" 
                          required 
                          type="password"
                          disabled={isLoading || !token}
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1.5" htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="text-slate-400 w-5 h-5" />
                        </div>
                        <input 
                          className="block w-full pl-10 pr-3 py-2 h-10 border border-slate-300 rounded-md leading-5 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-shadow" 
                          id="confirmPassword" 
                          name="confirmPassword" 
                          placeholder="••••••••" 
                          required 
                          type="password"
                          disabled={isLoading || !token}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-10 items-center disabled:opacity-75 disabled:cursor-not-allowed" 
                      type="submit"
                      disabled={isLoading || !token}
                    >
                      <span>{isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi'}</span>
                      {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                    </button>

                    <div className="text-center mt-4">
                      <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Batal
                      </Link>
                    </div>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                <p className="text-xs text-slate-500">
                  Sistem Inventori DIA MAKMUR ABADI © {new Date().getFullYear()}. Hak Cipta Dilindungi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Loading...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
