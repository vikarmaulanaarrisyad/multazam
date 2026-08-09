'use client';

import React, { useState } from 'react';
import { User, Mail, Lock, Save, Loader2 } from 'lucide-react';
import { updateProfile } from '../action';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface EditProfileFormProps {
  initialName: string;
  initialEmail: string;
}

export function EditProfileForm({ initialName, initialEmail }: EditProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await updateProfile(formData);

    setIsSubmitting(false);

    if (result.success) {
      MySwal.fire({
        title: <span className="text-xl font-extrabold text-slate-800">Berhasil!</span>,
        html: <p className="text-sm text-slate-500 font-medium mt-1">Profil Anda berhasil diperbarui.</p>,
        icon: 'success',
        confirmButtonText: 'Kembali ke Profil',
        confirmButtonColor: '#10b981',
        customClass: {
          popup: 'rounded-3xl shadow-2xl pb-6',
          confirmButton: 'rounded-xl font-bold px-8 py-3 shadow-md'
        }
      }).then(() => {
        router.push('/sales/profile');
      });
    } else {
      MySwal.fire({
        title: <span className="text-xl font-extrabold text-red-600">Gagal</span>,
        html: <p className="text-sm text-slate-500 font-medium mt-1">{result.error}</p>,
        icon: 'error',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-3xl shadow-2xl pb-6',
          confirmButton: 'rounded-xl font-bold px-8 py-3 shadow-md'
        }
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-bold text-slate-700 ml-1">Nama Lengkap</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            name="name"
            defaultValue={initialName}
            required
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Masukkan nama lengkap"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-bold text-slate-700 ml-1">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="email"
            name="email"
            defaultValue={initialEmail}
            required
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Masukkan alamat email"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-bold text-slate-700 ml-1">Kata Sandi Baru <span className="text-slate-400 font-medium text-[11px]">(Opsional)</span></label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="password"
            name="password"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Kosongkan jika tidak ingin mengubah"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:shadow-[0_12px_25px_rgb(59,130,246,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Simpan Perubahan</span>
          </>
        )}
      </button>
    </form>
  );
}
