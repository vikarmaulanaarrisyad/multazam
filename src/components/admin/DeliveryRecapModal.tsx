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
  const [isPrinting, setIsPrinting] = useState(false);

  // Set default ke besok
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Format ke YYYY-MM-DD dengan aman tanpa terpengaruh pergeseran UTC
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const d = String(tomorrow.getDate()).padStart(2, '0');
      setDateStr(`${y}-${m}-${d}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `/admin/print-recap?date=${dateStr}`;
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      // Small delay to ensure all assets/fonts are loaded
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print failed', e);
        }
        setIsPrinting(false);
        
        // Cleanup after print dialog is closed (with a generous delay)
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 60000);
      }, 500);
    };
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

      // Waktu Cetak
      const printTime = new Date().toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Header Laporan (Kop Surat)
      const displayDate = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'DIA MAKMUR ABADI';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
      titleCell.alignment = { horizontal: 'center' };

      sheet.mergeCells('A2:G2');
      const subTitleCell = sheet.getCell('A2');
      subTitleCell.value = 'REKAP PENGIRIMAN GUDANG';
      subTitleCell.font = { bold: true, size: 12, color: { argb: 'FF1D4ED8' } };
      subTitleCell.alignment = { horizontal: 'center' };

      sheet.mergeCells('A3:G3');
      const infoCell = sheet.getCell('A3');
      infoCell.value = `Tanggal Pengiriman: ${displayDate} | Waktu Cetak: ${printTime}`;
      infoCell.font = { italic: true, size: 10, color: { argb: 'FF475569' } };
      infoCell.alignment = { horizontal: 'center' };

      sheet.addRow([]); // Baris kosong untuk jarak

      // Header Tabel
      const tableHeader = sheet.addRow(['NO', 'KODE', 'NAMA BARANG', 'ISI (KEMASAN)', 'QTY DISIAPKAN', 'STOK GUDANG', 'CEK']);
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
        const isInsufficient = item.currentStock < item.totalQuantity;
        const row = sheet.addRow([
          idx + 1,
          item.code,
          item.name,
          item.contents || '-',
          item.totalQuantity,
          item.currentStock,
          ''
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          
          if (colNumber === 1 || colNumber === 4 || colNumber === 5 || colNumber === 6) {
            cell.alignment = { horizontal: 'center' };
          }
          
          // Style untuk Qty Disiapkan
          if (colNumber === 5) {
            cell.font = { bold: true, color: { argb: 'FF1D4ED8' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; // light blue bg
          }
          
          // Style untuk Stok Gudang
          if (colNumber === 6) {
            cell.font = { bold: true, color: { argb: isInsufficient ? 'FFDC2626' : 'FF059669' } }; // red if insufficient, else green
            if (isInsufficient) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }; // light red bg
            }
          }
        });
      });

      // Column widths
      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 15;
      sheet.getColumn(3).width = 45;
      sheet.getColumn(4).width = 20;
      sheet.getColumn(5).width = 20;
      sheet.getColumn(6).width = 20;
      sheet.getColumn(7).width = 15;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Rekap_Gudang_${dateStr}.xlsx`);
      
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
              disabled={isPrinting || isExporting}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold py-3 rounded-xl transition-colors"
            >
              {isPrinting ? (
                <>
                  <Printer className="w-5 h-5 animate-pulse" /> Memproses...
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" /> Cetak (PDF)
                </>
              )}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting || isPrinting}
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
