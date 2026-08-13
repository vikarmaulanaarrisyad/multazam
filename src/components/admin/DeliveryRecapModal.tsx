'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, FileSpreadsheet, Printer, Download } from 'lucide-react';
import { getDeliveryRecapAction } from '@/actions/delivery-actions';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface DeliveryRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeliveryRecapModal({ isOpen, onClose }: DeliveryRecapModalProps) {
  const [dateStr, setDateStr] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Set default ke besok
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDateStr(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.open(`/admin/print-recap?date=${dateStr}`, '_blank');
    onClose();
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await getDeliveryRecapAction(dateStr);
      if (!res.success || !res.data) {
        alert(res.error || 'Gagal mengambil data rekap.');
        return;
      }

      const items = res.data;
      if (items.length === 0) {
        alert('Tidak ada barang yang perlu disiapkan pada tanggal ini.');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Rekap Gudang');

      // Header Laporan
      const displayDate = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      sheet.addRow(['REKAP PENGIRIMAN GUDANG - DIA MAKMUR ABADI']);
      sheet.addRow([`Tanggal Kirim: ${displayDate}`]);
      sheet.addRow([]);

      sheet.getCell('A1').font = { bold: true, size: 14 };
      sheet.getCell('A2').font = { bold: true };

      // Header Tabel
      const tableHeader = sheet.addRow(['NO', 'KODE', 'NAMA BARANG', 'ISI (KEMASAN)', 'QTY DISIAPKAN', 'CEK GUDANG']);
      tableHeader.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      // Data
      items.forEach((item, idx) => {
        const row = sheet.addRow([
          idx + 1,
          item.code,
          item.name,
          item.contents || '-',
          item.totalQuantity,
          ''
        ]);
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (colNumber === 1 || colNumber === 4 || colNumber === 5) {
            cell.alignment = { horizontal: 'center' };
          }
          if (colNumber === 5) {
            cell.font = { bold: true, color: { argb: 'FF1D4ED8' } };
          }
        });
      });

      // Column widths
      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 15;
      sheet.getColumn(3).width = 40;
      sheet.getColumn(4).width = 20;
      sheet.getColumn(5).width = 20;
      sheet.getColumn(6).width = 15;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Rekap_Gudang_${dateStr}.xlsx`);
      
      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Pilih Tanggal Rekap
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Pilih tanggal pengiriman yang ingin direkap (otomatis menjumlahkan semua barang yang harus dikirim pada tanggal tersebut).
          </p>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Pengiriman</label>
            <input 
              type="date" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors"
            >
              <Printer className="w-5 h-5" /> Cetak (PDF)
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {isExporting ? <Download className="w-5 h-5 animate-bounce" /> : <FileSpreadsheet className="w-5 h-5" />}
              Unduh Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
