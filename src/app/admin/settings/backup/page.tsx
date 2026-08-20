'use client';

import React, { useState, useRef } from 'react';
import { Database, Download, Upload, AlertTriangle, ShieldCheck, HardDrive } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { saveAs } from 'file-saver';

const MySwal = withReactContent(Swal);

export default function BackupRestorePage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/backup', { method: 'GET' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal download backup');
      }

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const dateStr = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
      
      saveAs(blob, `Edia_Backup_${dateStr}.json`);
      
      MySwal.fire({
        icon: 'success',
        title: 'Backup Berhasil',
        text: 'File JSON berhasil diunduh.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      MySwal.fire('Error', error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      MySwal.fire('Error', 'File harus berformat .json', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsedData = JSON.parse(jsonContent);

        // Konfirmasi brutal
        const confirmResult = await MySwal.fire({
          title: 'PERINGATAN KERAS!',
          html: `<p class="text-red-600 font-bold">Proses ini akan MENGHAPUS SEMUA DATA saat ini dan menggantinya dengan data dari file backup!</p><br/><p>Pastikan Anda sudah membackup data saat ini sebelum melanjutkan.</p>`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Ya, Timpa Data Sekarang!',
          cancelButtonText: 'Batal'
        });

        if (confirmResult.isConfirmed) {
          await processRestore(parsedData);
        }
      } catch (err) {
        MySwal.fire('Error', 'File JSON tidak valid atau rusak.', 'error');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const processRestore = async (data: any) => {
    setIsImporting(true);
    MySwal.fire({
      title: 'Sedang Memulihkan Data...',
      text: 'Jangan tutup atau segarkan halaman ini!',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal restore data');
      }

      MySwal.fire({
        icon: 'success',
        title: 'Restore Berhasil!',
        text: 'Data sistem berhasil dipulihkan. Silakan muat ulang halaman.',
        confirmButtonText: 'Muat Ulang Sekarang'
      }).then(() => {
        window.location.href = '/admin';
      });

    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Restore Gagal',
        text: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-600" /> Backup & Restore Data
        </h1>
        <p className="text-slate-500 mt-2">
          Amankan data aplikasi Anda dengan mengunduh backup (cadangan) rutin, atau pulihkan data dari file backup sebelumnya.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Download className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Export Data (Backup)</h2>
          <p className="text-sm text-slate-600 mb-6 flex-1">
            Unduh seluruh data (Toko, Produk, Transaksi, dll) dalam format JSON tunggal. Data ini bisa Anda gunakan untuk dipulihkan nanti.
          </p>
          <button
            onClick={handleDownloadBackup}
            disabled={isExporting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengekstrak...</span>
            ) : (
              <><Download className="w-5 h-5" /> Unduh File Backup</>
            )}
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full z-0"></div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 relative z-10 border border-red-100">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 relative z-10 flex items-center gap-2">
            Import Data (Restore) <AlertTriangle className="w-4 h-4 text-red-500" />
          </h2>
          <p className="text-sm text-slate-600 mb-6 flex-1 relative z-10">
            Pulihkan data sistem dari file JSON Backup. <strong className="text-red-600">Peringatan:</strong> Proses ini akan menimpa dan menghapus seluruh data Anda saat ini.
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
          
          <button
            onClick={handleRestoreClick}
            disabled={isImporting}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-50 relative z-10"
          >
            <Upload className="w-5 h-5" /> Pulihkan dari Backup
          </button>
        </div>
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Rekomendasi Backup Server (Tingkat Lanjut)
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Selain Backup manual melalui panel ini, Anda juga memiliki skrip otomatis <strong>Auto-Dump PostgreSQL</strong> yang terpasang di Server Aplikasi Anda.
        </p>
        <div className="bg-slate-900 text-slate-300 text-xs font-mono p-4 rounded-xl flex items-start gap-3">
          <HardDrive className="w-5 h-5 text-slate-400 shrink-0" />
          <div>
            <p className="text-slate-400 mb-1">Jalankan perintah ini di VPS/Server untuk menarik Full Database SQL (Struktur + Data):</p>
            <code className="text-green-400 font-bold select-all">node scripts/db-backup.js</code>
          </div>
        </div>
      </div>
    </div>
  );
}
