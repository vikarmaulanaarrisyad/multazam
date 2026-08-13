'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isOpenRef = useRef(isOpen);

  // Update isOpenRef whenever isOpen changes
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) {
      // Cleanup if closed
      setIsPrinting(false);
      setIsExporting(false);
      if (iframeRef.current && document.body.contains(iframeRef.current)) {
        document.body.removeChild(iframeRef.current);
        iframeRef.current = null;
      }
    }
  }, [isOpen]);

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

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const res = await getDeliveryRecapAction(dateStr);
      if (!isOpenRef.current) return;
      if (!res.success || !res.data) {
        alert(res.error || 'Gagal mengambil data rekap.');
        return;
      }

      const items = res.data.global;
      if (items.length === 0) {
        alert('Tidak ada barang yang perlu disiapkan pada tanggal ini.');
        return;
      }

      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('DIA MAKMUR ABADI', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(29, 78, 216); // blue-700
      doc.text('REKAP PENGIRIMAN GUDANG', 105, 22, { align: 'center' });

      // Date info
      const displayDate = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const printTime = new Date().toLocaleString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Tanggal Pengiriman: ${displayDate} | Waktu Cetak: ${printTime}`, 105, 28, { align: 'center' });

      // Global Table
      const tableBody = items.map((item, idx) => {
        const isInsufficient = item.currentStock < item.totalBaseQuantity;
        return [
          idx + 1,
          item.code,
          item.name,
          item.contents || '-',
          `${item.totalQuantity} ${item.unit}`,
          { content: item.formattedStock, styles: { textColor: isInsufficient ? [220, 38, 38] as [number, number, number] : [5, 150, 105] as [number, number, number] } },
          ''
        ];
      });

      autoTable(doc, {
        startY: 35,
        head: [['NO', 'KODE', 'NAMA BARANG', 'ISI (KEMASAN)', 'QTY DISIAPKAN', 'STOK GUDANG', 'CEK']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontSize: 8 }, // slate-800
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 25 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'right', fontStyle: 'bold', textColor: [29, 78, 216], fillColor: [239, 246, 255] }, // blue-700 on blue-50
          5: { halign: 'right', fontStyle: 'bold' },
          6: { halign: 'center', cellWidth: 15 },
        }
      });

      // Stores section
      const stores = res.data.stores;
      if (stores && stores.length > 0) {
        let finalY = (doc as any).lastAutoTable.finalY + 15;
        
        // Add page if needed
        if (finalY > 260) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text('RINCIAN PESANAN PER TOKO', 14, finalY);
        doc.setLineWidth(0.5);
        doc.line(14, finalY + 2, 196, finalY + 2);
        
        finalY += 10;

        const storeTableBody: any[] = [];
        stores.forEach((store) => {
          storeTableBody.push([
            {
              content: `TOKO: ${store.customerName.toUpperCase()} (Sales: ${store.salesName})`,
              colSpan: 4,
              styles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', halign: 'left' }
            }
          ]);
          
          store.items.forEach((item, iIdx) => {
            storeTableBody.push([
              iIdx + 1,
              item.name,
              { content: `${item.quantity} ${item.unit}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [29, 78, 216], fillColor: [239, 246, 255] } },
              ''
            ]);
          });
        });

        autoTable(doc, {
          startY: finalY,
          head: [['NO', 'NAMA BARANG', 'QTY', 'CEK']],
          body: storeTableBody,
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontSize: 8 }, // slate-800
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 35 },
            3: { halign: 'center', cellWidth: 15 }
          },
          margin: { left: 14, right: 14 }
        });
      }

      // Signatures
      let currentY = (doc as any).lastAutoTable.finalY + 25;
      if (currentY > 250) {
        doc.addPage();
        currentY = 30;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      
      doc.text('Disiapkan Oleh (Gudang)', 40, currentY, { align: 'center' });
      doc.text('Diperiksa Oleh (Checker)', 105, currentY, { align: 'center' });
      doc.text('Mengetahui (Admin / PJ)', 170, currentY, { align: 'center' });
      
      currentY += 25;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      
      doc.setLineWidth(0.5);
      doc.line(15, currentY - 4, 65, currentY - 4);
      doc.text('Nama & Tanda Tangan', 40, currentY, { align: 'center' });
      
      doc.line(80, currentY - 4, 130, currentY - 4);
      doc.text('Nama & Tanda Tangan', 105, currentY, { align: 'center' });
      
      doc.line(145, currentY - 4, 195, currentY - 4);
      doc.text('Nama & Tanda Tangan', 170, currentY, { align: 'center' });

      doc.save(`Rekap-Pengiriman-${dateStr}.pdf`);
    } catch (e: any) {
      console.error('PDF generation failed', e);
      alert('Gagal mengunduh PDF.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await getDeliveryRecapAction(dateStr);

      // If modal was closed while fetching data, abort
      if (!isOpenRef.current) return;

      if (!res.success || !res.data) {
        alert(res.error || 'Gagal mengambil data rekap.');
        return;
      }

      const items = res.data.global;
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

      // Data Global
      items.forEach((item, idx) => {
        const isInsufficient = item.currentStock < item.totalBaseQuantity;
        const row = sheet.addRow([
          idx + 1,
          item.code,
          item.name,
          item.contents || '-',
          `${item.totalQuantity} ${item.unit}`,
          item.formattedStock,
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

      // Add Store Details if available
      const stores = res.data.stores;
      if (stores && stores.length > 0) {
        sheet.addRow([]);
        sheet.addRow([]);
        
        const storeTitleRow = sheet.addRow(['RINCIAN PESANAN PER TOKO']);
        storeTitleRow.getCell(1).font = { bold: true, size: 14 };
        sheet.mergeCells(`A${storeTitleRow.number}:G${storeTitleRow.number}`);
        sheet.addRow([]);
        
        stores.forEach((store) => {
          const storeHeaderRow = sheet.addRow([`TOKO: ${store.customerName.toUpperCase()} (Sales: ${store.salesName})`]);
          storeHeaderRow.getCell(1).font = { bold: true };
          storeHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          sheet.mergeCells(`A${storeHeaderRow.number}:G${storeHeaderRow.number}`);
          
          const colHeader = sheet.addRow(['No', 'Nama Barang', '', '', 'Qty']);
          colHeader.eachCell((cell, colNumber) => {
            if (colNumber === 1 || colNumber === 2 || colNumber === 5) {
              cell.font = { bold: true, size: 10 };
              cell.border = { bottom: { style: 'thin' } };
            }
          });
          
          store.items.forEach((item, iIdx) => {
            const row = sheet.addRow([iIdx + 1, item.name, '', '', `${item.quantity} ${item.unit}`]);
            row.getCell(5).font = { bold: true };
            row.getCell(5).alignment = { horizontal: 'left' };
          });
          
          sheet.addRow([]); // Blank row between stores
        });
      }

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
