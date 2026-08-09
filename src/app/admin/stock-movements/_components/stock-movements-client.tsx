'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { exportAllStockMovements } from '@/actions/stock-movements';
import { StockMovementWithProduct } from '@/repositories/stock-movement.repository';
import { DataTable } from '@/components/datatable/DataTable';
import { Input } from '@/components/ui/input';
import { Search, FileDown, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StockMovementsClientProps {
  initialData: StockMovementWithProduct[];
  metadata: {
    total: number;
    pageCount: number;
  };
}

export function StockMovementsClient({ initialData, metadata }: StockMovementsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [isExporting, setIsExporting] = useState(false);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams);
    
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    
    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');
    
    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePaginationChange = (updater: any) => {
    const newState = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;
    const params = new URLSearchParams(searchParams);
    params.set('page', (newState.pageIndex + 1).toString());
    params.set('limit', newState.pageSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = await exportAllStockMovements(searchTerm, startDate, endDate);
      if (!result.success || !result.data || result.data.length === 0) {
        alert('Tidak ada data untuk diekspor atau gagal memuat data.');
        setIsExporting(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DIA MAKMUR ABADI';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Riwayat Stok', {
        views: [{ showGridLines: false }]
      });

      // --- 1. TITLE SECTION ---
      sheet.mergeCells('A1:M1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'LAPORAN RIWAYAT PERGERAKAN STOK';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.mergeCells('A2:M2');
      const subtitleCell = sheet.getCell('A2');
      subtitleCell.value = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF64748B' } };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.addRow([]); // empty row 3

      // --- 2. HEADERS ---
      const headers = [
        'No', 'Waktu', 'Kode Produk', 'Nama Produk', 'Tipe',
        'Jml (Sistem)', 'Jml (Terkecil)', 'Sisa (Sistem)', 'Sisa (Terkecil)',
        'Nama Sales', 'Nama Toko', 'No. PO', 'Catatan/Keterangan'
      ];
      const headerRow = sheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });
      headerRow.height = 30;

      // --- 3. DATA ROWS ---
      result.data.forEach((movement, index) => {
        let multiplier = 1;
        let smallestUnit = movement.product.retailPriceNote || 'Pcs';
        
        if (movement.product.contents) {
          const match = movement.product.contents.match(/(\d+)/);
          if (match) multiplier = parseInt(match[1], 10);
          const unitMatch = movement.product.contents.match(/[a-zA-Z]+/);
          if (unitMatch) smallestUnit = unitMatch[0];
        }

        const quantitySmallestUnit = movement.quantity * multiplier;
        const balanceAfterSmallestUnit = movement.balanceAfter * multiplier;

        const tipeStr = movement.type === 'IN' ? 'Masuk' : movement.type === 'OUT' ? 'Keluar' : 'Penyesuaian';
        const qtyPrefix = movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '';

        // Extract PO from notes if it exists
        let rawNotes = movement.transaction?.notes || movement.notes || '';
        let poNumber = '-';
        const poMatch = rawNotes.match(/PO\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i);
        if (poMatch) {
          poNumber = poMatch[1];
          rawNotes = rawNotes.replace(poMatch[0], '').trim();
          // Remove any leading or trailing punctuation from leftover note
          rawNotes = rawNotes.replace(/^[,.\-\s]+|[,.\-\s]+$/g, '');
        }
        const cleanNotes = [movement.reference, rawNotes].filter(Boolean).join(' - ');

        const row = sheet.addRow([
          index + 1,
          format(new Date(movement.createdAt), 'dd MMM yyyy, HH:mm', { locale: id }),
          movement.product.code,
          movement.product.name,
          tipeStr,
          `${qtyPrefix}${movement.quantity}`,
          `${qtyPrefix}${quantitySmallestUnit} ${smallestUnit}`,
          movement.balanceAfter,
          `${balanceAfterSmallestUnit} ${smallestUnit}`,
          movement.transaction?.user?.name || '-',
          movement.transaction?.customerName || '-',
          poNumber,
          cleanNotes || '-'
        ]);

        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
          cell.alignment = { vertical: 'top', horizontal: [1, 5, 6, 7, 8, 9].includes(colNumber) ? 'center' : 'left' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };

          if (colNumber === 5) {
            cell.font = { 
              name: 'Arial', size: 10, bold: true, 
              color: { argb: movement.type === 'IN' ? 'FF15803D' : movement.type === 'OUT' ? 'FFB91C1C' : 'FF1D4ED8' } 
            };
          }
          if (colNumber === 6 || colNumber === 7) {
            cell.font = { 
              name: 'Arial', size: 10, bold: true,
              color: { argb: movement.type === 'IN' ? 'FF16A34A' : movement.type === 'OUT' ? 'FFDC2626' : 'FF334155' } 
            };
          }
        });
      });

      // --- 4. COLUMN WIDTHS ---
      sheet.columns = [
        { width: 8 },  // No
        { width: 22 }, // Waktu
        { width: 18 }, // Kode
        { width: 35 }, // Nama
        { width: 12 }, // Tipe
        { width: 15 }, // Jml Sistem
        { width: 20 }, // Jml Terkecil
        { width: 15 }, // Sisa Sistem
        { width: 20 }, // Sisa Terkecil
        { width: 25 }, // Nama Sales
        { width: 30 }, // Nama Toko
        { width: 20 }, // No PO
        { width: 35 }, // Keterangan
      ];

      // --- 5. EXPORT FILE ---
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Export_Riwayat_Stok_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Terjadi kesalahan saat mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      id: 'no',
      header: 'No',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-slate-500">
          {(page - 1) * limit + row.index + 1}
        </div>
      ),
    },
    {
      id: 'waktu',
      header: 'Waktu',
      cell: ({ row }: { row: any }) => format(new Date(row.original.createdAt), 'dd MMM yyyy, HH:mm', { locale: id }),
    },
    {
      id: 'produk',
      header: 'Produk',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <div>
            <div className="font-medium text-slate-900">{movement.product.name}</div>
            <div className="text-xs text-slate-500">{movement.product.code}</div>
          </div>
        );
      },
    },
    {
      id: 'tipe',
      header: 'Tipe',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        if (movement.type === 'IN') {
          return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Masuk</span>;
        } else if (movement.type === 'OUT') {
          return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Keluar</span>;
        } else {
          return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Penyesuaian</span>;
        }
      },
    },
    {
      id: 'jumlah',
      header: 'Jumlah',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <span className={`font-semibold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
            {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
          </span>
        );
      },
    },
    {
      id: 'sisa_stok',
      header: 'Sisa Stok',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <span className="text-slate-600 font-medium">
            {movement.balanceAfter}
          </span>
        );
      },
    },
    {
      id: 'keterangan',
      header: 'Keterangan',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <div className="text-sm">
            <div className="text-slate-900">{movement.reference || '-'}</div>
            {movement.notes && <div className="text-xs text-slate-500">{movement.notes}</div>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari nama atau kode produk..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </form>
          <div className="flex items-center gap-2">
            <Input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white w-auto"
              title="Dari Tanggal"
            />
            <span className="text-slate-400">-</span>
            <Input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white w-auto"
              title="Sampai Tanggal"
            />
            <button 
              onClick={(e) => handleSearch(e as any)}
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold border border-blue-200 transition-all whitespace-nowrap"
            >
              Filter
            </button>
          </div>
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-all border border-emerald-200 whitespace-nowrap disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
            Export Excel
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <DataTable
          columns={columns}
          data={initialData}
          pageCount={metadata.pageCount}
          pagination={{ pageIndex: page - 1, pageSize: limit }}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  );
}
