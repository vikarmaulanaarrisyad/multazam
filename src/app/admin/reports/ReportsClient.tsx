'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsClient() {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/export?month=${month}&year=${year}`, {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error('Gagal membuat laporan');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Terpusat_${months.find(m => m.value === month)?.label}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Laporan berhasil diunduh!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengunduh laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pusat Unduhan Laporan</h1>
        <p className="text-sm text-slate-500">Buat dan unduh laporan lengkap dalam format Excel multi-sheet.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Export Laporan Terpusat</h2>
            <p className="text-sm text-slate-500">Mencakup Keuangan, Pergerakan Stok, & GPS Sales.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bulan</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select 
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tahun</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select 
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Isi File Laporan (Excel):</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                <span className="font-medium text-slate-700">Sheet 1: Keuangan & Laba/Rugi</span> (Data Transaksi Selesai & Gross Profit)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                <span className="font-medium text-slate-700">Sheet 2: Pergerakan Stok</span> (Barang masuk, barang keluar, retur)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                <span className="font-medium text-slate-700">Sheet 3: GPS & Kunjungan Sales</span> (Data check-in & lokasi toko)
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Download className="w-5 h-5" />
            )}
            {loading ? 'Menghasilkan Laporan...' : 'Download Laporan Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
