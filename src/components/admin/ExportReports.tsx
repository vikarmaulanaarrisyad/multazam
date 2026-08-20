'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { getSalesExportData, getDeadStockExportData } from '@/actions/export-actions';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

export function ExportReports() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'SALES' | 'DEAD_STOCK'>('SALES');
  
  // Sales specific states
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Dead Stock specific state
  const [deadStockDays, setDeadStockDays] = useState<number>(30);

  const handleExportSales = async () => {
    setIsExporting(true);
    toast.loading('Menyiapkan Laporan Penjualan...', { id: 'export-sales' });
    try {
      const res = await getSalesExportData(selectedMonth, selectedYear);
      if (!res.success || !res.data) throw new Error(res.error || 'Gagal memuat data');

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistem Edia';
      const sheet = workbook.addWorksheet('Laporan Penjualan');

      // Title
      sheet.mergeCells('A1:J1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `LAPORAN PENJUALAN & LABA RUGI - ${format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy', { locale: id }).toUpperCase()}`;
      titleCell.font = { name: 'Arial', size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center' };
      
      // Header
      const headerRow = sheet.getRow(3);
      headerRow.values = [
        'No', 'Tanggal', 'No. Invoice', 'Pelanggan', 'Sales', 
        'Produk', 'Qty', 'Harga Jual (Rp)', 'Total Jual (Rp)', 'Laba Kotor (Rp)'
      ];
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
      headerRow.height = 25;

      let rowIndex = 4;
      let totalRevenue = 0;
      let totalProfit = 0;

      res.data.forEach((tx: any, idx: number) => {
        const txDate = format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm');
        
        tx.items.forEach((item: any, itemIdx: number) => {
          const qty = item.quantity;
          const sellPrice = Number(item.price);
          const totalSell = qty * sellPrice;
          
          const purchasePrice = Number(item.purchasePrice || 0);
          const cogs = qty * purchasePrice;
          const profit = totalSell - cogs;

          totalRevenue += totalSell;
          totalProfit += profit;

          const row = sheet.getRow(rowIndex);
          row.values = [
            itemIdx === 0 ? idx + 1 : '',
            itemIdx === 0 ? txDate : '',
            itemIdx === 0 ? tx.invoiceNumber : '',
            itemIdx === 0 ? tx.customerName || '-' : '',
            itemIdx === 0 ? tx.user?.name || '-' : '',
            item.product.name,
            qty,
            sellPrice,
            totalSell,
            profit
          ];

          row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
            };
            if (colNumber >= 7) {
              cell.alignment = { horizontal: 'right' };
              cell.numFmt = '#,##0';
            }
            if (colNumber === 10) {
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: profit >= 0 ? 'FF16A34A' : 'FFDC2626' } };
            }
          });
          rowIndex++;
        });
      });

      // Total Row
      const totalRow = sheet.getRow(rowIndex + 1);
      totalRow.getCell(8).value = 'TOTAL KESELURUHAN:';
      totalRow.getCell(8).font = { bold: true };
      totalRow.getCell(9).value = totalRevenue;
      totalRow.getCell(9).font = { bold: true };
      totalRow.getCell(9).numFmt = '#,##0';
      totalRow.getCell(10).value = totalProfit;
      totalRow.getCell(10).font = { bold: true, color: { argb: 'FF16A34A' } };
      totalRow.getCell(10).numFmt = '#,##0';

      // Widths
      sheet.columns = [
        { width: 5 }, { width: 18 }, { width: 18 }, { width: 25 }, { width: 20 },
        { width: 35 }, { width: 8 }, { width: 15 }, { width: 18 }, { width: 18 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_Penjualan_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`);
      
      toast.success('Laporan berhasil diunduh', { id: 'export-sales' });
      setIsOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengekspor laporan', { id: 'export-sales' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDeadStock = async () => {
    setIsExporting(true);
    toast.loading('Menyiapkan Laporan Dead Stock...', { id: 'export-ds' });
    try {
      const res = await getDeadStockExportData(deadStockDays);
      if (!res.success || !res.data) throw new Error(res.error || 'Gagal memuat data');

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Stok Mematung');

      sheet.mergeCells('A1:F1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `LAPORAN STOK MEMATUNG (TIDAK TERJUAL > ${deadStockDays} HARI)`;
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFDC2626' } };
      titleCell.alignment = { horizontal: 'center' };

      const headerRow = sheet.getRow(3);
      headerRow.values = ['No', 'Kode Produk', 'Nama Produk', 'Kategori', 'Sisa Stok', 'Nilai Aset (COGS)'];
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      let totalAsset = 0;
      res.data.forEach((p: any, idx: number) => {
        const assetValue = Number(p.purchasePrice || 0) * p.stock;
        totalAsset += assetValue;
        const row = sheet.addRow([
          idx + 1,
          p.code,
          p.name,
          p.category?.name || '-',
          `${p.stock} ${p.unit?.name || 'PCS'}`,
          assetValue
        ]);

        row.getCell(6).numFmt = '#,##0';
      });

      const totalRow = sheet.addRow(['', '', '', '', 'TOTAL ASET MENGENDAP:', totalAsset]);
      totalRow.getCell(5).font = { bold: true };
      totalRow.getCell(6).font = { bold: true, color: { argb: 'FFDC2626' } };
      totalRow.getCell(6).numFmt = '#,##0';

      sheet.columns = [
        { width: 5 }, { width: 15 }, { width: 40 }, { width: 20 }, { width: 15 }, { width: 25 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_Dead_Stock_${deadStockDays}Hari_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      
      toast.success('Laporan berhasil diunduh', { id: 'export-ds' });
      setIsOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengekspor laporan', { id: 'export-ds' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-all text-sm shadow-sm"
      >
        <Download className="w-4 h-4" />
        Ekspor Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> 
                Unduh Laporan (Excel)
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                disabled={isExporting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Jenis Laporan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportType('SALES')}
                    className={`py-2 px-3 border-2 rounded-xl text-sm font-bold transition-all ${exportType === 'SALES' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Penjualan & Laba
                  </button>
                  <button
                    onClick={() => setExportType('DEAD_STOCK')}
                    className={`py-2 px-3 border-2 rounded-xl text-sm font-bold transition-all ${exportType === 'DEAD_STOCK' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Stok Mematung
                  </button>
                </div>
              </div>

              {/* Dynamic Options based on type */}
              {exportType === 'SALES' ? (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bulan</label>
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i+1} value={i+1}>{format(new Date(2000, i, 1), 'MMMM', { locale: id })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tahun</label>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Lama Tidak Terjual</label>
                  <select 
                    value={deadStockDays}
                    onChange={(e) => setDeadStockDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value={30}>Lebih dari 30 Hari</option>
                    <option value={60}>Lebih dari 60 Hari</option>
                    <option value={90}>Lebih dari 90 Hari (3 Bulan)</option>
                    <option value={180}>Lebih dari 180 Hari (6 Bulan)</option>
                  </select>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={exportType === 'SALES' ? handleExportSales : handleExportDeadStock}
                disabled={isExporting}
                className={`w-full py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all shadow-md ${
                  exportType === 'SALES' 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyiapkan File...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Unduh Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
