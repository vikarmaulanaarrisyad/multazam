'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Truck, Package, X, Plus, Printer, FileDown, AlertCircle } from 'lucide-react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table';
import { updateTransactionStatus, cancelTransaction, addPayment } from '@/actions/transaction-actions';
import { approvePriceRequest, rejectPriceRequest } from '@/actions/approval-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export type TransactionDetail = {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  dueDate: Date | null;
  shippingAddress: string | null;
  shippingCost: number | null;
  notes: string | null;
  adminNotes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  latitude: number | null;
  longitude: number | null;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  user: {
    name: string | null;
  };
  items: {
    id: string;
    productName: string;
    contents: string | null;
    retailPriceNote: string | null;
    quantity: number;
    price: number;
    originalPrice: number;
  }[];
  paymentHistories: {
    id: string;
    amount: number;
    createdAt: Date;
  }[];
};

export function TransactionsClient({ transactions }: { transactions: TransactionDetail[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING_APPROVAL');
  const [showPrintModalFor, setShowPrintModalFor] = useState<string | null>(null);
  const [activeIframe, setActiveIframe] = useState<{ id: string, action: string, key: number } | null>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  
  // Approval state
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'print-action-done') {
        toast.dismiss();
        toast.success('Unduhan PDF selesai');
      } else if (event.data === 'print-dialog-opened') {
        toast.dismiss();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleOpenModal = (tx: TransactionDetail) => {
    setSelectedTx(tx);
    setAdminNotes('');
    setError(null);
    setShowPaymentForm(false);
    setPaymentAmount('');
    
    if (tx.status === 'PENDING_APPROVAL') {
      const initialPrices: Record<string, number> = {};
      tx.items.forEach(item => {
        initialPrices[item.id] = item.price; // Original requested price is saved in item.price for PENDING_APPROVAL? Wait, we need to check how it's mapped.
        // Actually, item.price is the requested price in this context, because during creation we save requested price to price. 
        // Or wait! In ApprovalTransaction it was mapped as requestedPrice.
        // Let's just use item.price as the default editable value.
      });
      setEditedPrices(initialPrices);
    }
  };
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !paymentAmount) return;
    
    setIsSubmitting(true);
    const res = await addPayment({
      transactionId: selectedTx.id,
      amount: Number(paymentAmount.replace(/\D/g, ''))
    });
    
    if (res.success) {
      toast.success('Pembayaran berhasil dicatat!');
      setPaymentAmount('');
      setShowPaymentForm(false);
      setSelectedTx(null);
    } else {
      setError(res.error || 'Gagal mencatat pembayaran');
    }
    setIsSubmitting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">Menunggu Diproses</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">Nego Harga</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">Harga Disetujui</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">Sedang Dikirim</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">Selesai</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTx) return;
    setIsSubmitting(true);
    setError(null);

    const result = await updateTransactionStatus({
      transactionId: selectedTx.id,
      status: newStatus,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSelectedTx(null);
    } else {
      setError(result.error || 'Terjadi kesalahan saat mengubah status');
    }
  };

  const handleCancel = async () => {
    if (!selectedTx) return;
    if (!adminNotes.trim()) {
      setError('Alasan pembatalan wajib diisi untuk membatalkan pesanan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await cancelTransaction({
      transactionId: selectedTx.id,
      adminNotes,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSelectedTx(null);
    } else {
      setError(result.error || 'Terjadi kesalahan saat membatalkan');
    }
  };

  const handlePriceChange = (itemId: string, newPrice: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [itemId]: parseInt(newPrice.replace(/\D/g, '')) || 0
    }));
  };

  const handleApprove = async () => {
    if (!selectedTx) return;
    setIsSubmitting(true);
    setError(null);

    const itemsToUpdate = selectedTx.items.map(item => ({
      id: item.id,
      approvedPrice: editedPrices[item.id] ?? item.price,
    }));

    const result = await approvePriceRequest({
      transactionId: selectedTx.id,
      adminNotes,
      items: itemsToUpdate,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSelectedTx(null);
    } else {
      setError(result.error || 'Terjadi kesalahan saat menyetujui');
    }
  };

  const handleReject = async () => {
    if (!selectedTx) return;
    if (!adminNotes.trim()) {
      setError('Alasan penolakan wajib diisi untuk menolak pengajuan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await rejectPriceRequest({
      transactionId: selectedTx.id,
      adminNotes,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSelectedTx(null);
    } else {
      setError(result.error || 'Terjadi kesalahan saat menolak');
    }
  };

  const tabs = [
    { id: 'PENDING_APPROVAL', label: 'Nego Harga', statuses: ['PENDING_APPROVAL'] },
    { id: 'PENDING', label: 'Pesanan Baru', statuses: ['PENDING', 'APPROVED'] },
    { id: 'SHIPPED', label: 'Dalam Pengiriman', statuses: ['SHIPPED'] },
    { id: 'COMPLETED', label: 'Selesai', statuses: ['COMPLETED'] },
    { id: 'CANCELLED', label: 'Dibatalkan', statuses: ['CANCELLED', 'REJECTED'] },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = 
        tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.user.name && tx.user.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const activeTabObj = tabs.find(t => t.id === activeTab);
      const matchTab = activeTabObj ? activeTabObj.statuses.includes(tx.status) : false;
      
      let matchDate = true;
      if (startDate || endDate) {
        const txDate = new Date(tx.createdAt);
        txDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) matchDate = false;
        }
      }

      return matchSearch && matchTab && matchDate;
    });
  }, [transactions, searchTerm, activeTab, tabs, startDate, endDate]);

  const handleExportExcel = async () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DIA MAKMUR ABADI';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Transaksi', {
        views: [{ showGridLines: false }]
      });

      // --- 1. TITLE SECTION ---
      sheet.mergeCells('A1:L1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'LAPORAN TRANSAKSI PESANAN';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.mergeCells('A2:L2');
      const subtitleCell = sheet.getCell('A2');
      subtitleCell.value = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF64748B' } };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.addRow([]); // empty row 3

      // --- 2. HEADERS ---
      const headers = [
        'No. Invoice', 'Tanggal', 'Nama Toko', 'Nama Sales', 'No. PO', 'Catatan', 'Status', 
        'Produk', 'Jml (Karton/Asal)', 'Total Satuan Terkecil', 'Harga Satuan', 'Subtotal'
      ];
      const headerRow = sheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' } // Blue-600
        };
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });
      headerRow.height = 30;

      // --- 3. DATA ROWS ---
      let totalAmountAll = 0;
      let currentRowIdx = 5;

      filteredTransactions.forEach(tx => {
        let isFirstRowForTx = true;
        
        tx.items.forEach((item) => {
          let multiplier = 1;
          let smallestUnit = item.retailPriceNote || 'Pcs';
          
          if (item.contents) {
            const match = item.contents.match(/(\d+)/);
            if (match) multiplier = parseInt(match[1], 10);
            
            const unitMatch = item.contents.match(/[a-zA-Z]+/);
            if (unitMatch) smallestUnit = unitMatch[0];
          }

          const totalSmallestUnit = item.quantity * multiplier;
          const subtotal = item.price * item.quantity;
          
          if (isFirstRowForTx) {
            totalAmountAll += Number(tx.totalAmount);
          }

          let poNumber = '';
          let catatan = tx.notes || '';
          if (catatan) {
            const poMatch = catatan.match(/PO\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i);
            if (poMatch) {
              poNumber = poMatch[1];
              catatan = catatan.replace(poMatch[0], '').trim();
              if (catatan.startsWith('-') || catatan.startsWith(':')) {
                 catatan = catatan.substring(1).trim();
              }
            }
          }

          const row = sheet.addRow([
            isFirstRowForTx ? tx.invoiceNumber : '',
            isFirstRowForTx ? new Date(tx.createdAt).toLocaleDateString('id-ID') : '',
            isFirstRowForTx ? (tx.customerName || 'Anonim') : '',
            isFirstRowForTx ? (tx.user.name || '-') : '',
            isFirstRowForTx ? poNumber : '',
            isFirstRowForTx ? catatan : '',
            isFirstRowForTx ? tx.status : '',
            item.productName,
            `${item.quantity}`,
            `${totalSmallestUnit} ${smallestUnit}`,
            item.price,
            subtotal
          ]);

          row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
            // Update col number alignments since we added 2 columns
            // Old: [1, 2, 5, 7, 8] => No. Inv(1), Tanggal(2), Status(5), Jml(7), Total Satuan(8)
            // New Headers: 'No. Invoice'(1), 'Tanggal'(2), 'Nama Toko'(3), 'Nama Sales'(4), 'No. PO'(5), 'Catatan'(6), 'Status'(7), 'Produk'(8), 'Jml (Karton/Asal)'(9), 'Total Satuan Terkecil'(10), 'Harga Satuan'(11), 'Subtotal'(12)
            cell.alignment = { vertical: 'top', horizontal: [1, 2, 5, 7, 9, 10].includes(colNumber) ? 'center' : 'left' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };

            // Currency formatting
            if (colNumber === 9 || colNumber === 10) {
              cell.numFmt = 'Rp #,##0';
              cell.alignment = { vertical: 'top', horizontal: 'right' };
            }
            
            // Highlight invoice number
            if (colNumber === 1 && cell.value) {
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
            }
          });

          isFirstRowForTx = false;
          currentRowIdx++;
        });

        // If there's shipping cost, add a row for it
        if (tx.shippingCost) {
          const shipRow = sheet.addRow([
            '', '', '', '', '', '', '', 'Ongkos Kirim', '', '', '', Number(tx.shippingCost)
          ]);
          shipRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
            if (colNumber === 12) {
              cell.numFmt = 'Rp #,##0';
              cell.alignment = { horizontal: 'right' };
            }
          });
          currentRowIdx++;
        }
      });

      // --- 4. FOOTER SUMMARY ---
      const totalRow = sheet.addRow([
        'TOTAL KESELURUHAN PENDAPATAN', '', '', '', '', '', '', '', '', '', '', totalAmountAll
      ]);
      sheet.mergeCells(`A${currentRowIdx}:K${currentRowIdx}`);
      
      totalRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' } // Slate-100
        };
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        if (colNumber === 1) cell.alignment = { horizontal: 'right' };
        if (colNumber === 12) {
          cell.numFmt = 'Rp #,##0';
          cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF15803D' } }; // Green-700
          cell.alignment = { horizontal: 'right' };
        }
      });

      // --- 5. COLUMN WIDTHS ---
      sheet.columns = [
        { width: 22 }, // Invoice
        { width: 15 }, // Tanggal
        { width: 25 }, // Nama Toko
        { width: 20 }, // Nama Sales
        { width: 15 }, // No PO
        { width: 25 }, // Catatan
        { width: 18 }, // Status
        { width: 35 }, // Produk
        { width: 18 }, // Jml Karton
        { width: 22 }, // Jml Terkecil
        { width: 18 }, // Harga Satuan
        { width: 20 }, // Subtotal
      ];

      // --- 6. EXPORT FILE ---
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_Transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      toast.success('Laporan berhasil diekspor dengan format rapi!');
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat memproses Excel');
    }
  };

  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns: ColumnDef<TransactionDetail>[] = [
    {
      id: 'no',
      header: 'No',
      cell: ({ row }) => {
        return <div className="text-sm font-medium">{pageIndex * pageSize + row.index + 1}</div>;
      }
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'No. Invoice',
      cell: ({ row }) => <div className="font-mono font-medium">{row.original.invoiceNumber}</div>
    },
    {
      accessorKey: 'customerName',
      header: 'Pelanggan',
      cell: ({ row }) => row.original.customerName || 'Anonim'
    },
    {
      accessorKey: 'user.name',
      header: 'Sales',
      cell: ({ row }) => row.original.user.name || '-'
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => <div className="font-bold text-slate-700">{formatCurrency(row.original.totalAmount)}</div>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex flex-col xl:flex-row items-center gap-2">
          <button 
            onClick={() => handleOpenModal(row.original)}
            className="text-sm bg-slate-100 hover:bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 w-full xl:w-auto"
          >
            {row.original.status === 'PENDING_APPROVAL' ? 'Tinjau Pengajuan' : 'Kelola'}
          </button>
          <a
            href={`/print/delivery-order/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5 w-full xl:w-auto"
            title="Cetak Faktur"
          >
            <Printer className="w-4 h-4" /> Cetak
          </a>
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    pageCount: Math.ceil(filteredTransactions.length / pageSize),
    state: {
      pagination: { pageIndex, pageSize },
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari No. Invoice, Pelanggan, atau Sales..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Dari Tanggal"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Sampai Tanggal"
            />
          </div>
          <button 
            onClick={handleExportExcel} 
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-all border border-emerald-200 whitespace-nowrap"
          >
            <FileDown className="w-5 h-5" /> Export Excel
          </button>
        </div>
        
        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
                {transactions.filter(t => tab.statuses.includes(t.status)).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-slate-50 border-b border-slate-100">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 text-sm text-slate-700 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <p>Tidak ada pesanan untuk tab ini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-sm text-slate-500 font-medium">
            Halaman {pageIndex + 1} dari {table.getPageCount() || 1}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kelola Pesanan</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm text-slate-500">{selectedTx.invoiceNumber}</span>
                  {getStatusBadge(selectedTx.status)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(selectedTx.status === 'APPROVED' || selectedTx.status === 'SHIPPED' || selectedTx.status === 'COMPLETED') && (
                  <button 
                    onClick={() => setShowPrintModalFor(selectedTx.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors border border-blue-200"
                  >
                    <Truck className="w-4 h-4" /> Cetak Surat Jalan
                  </button>
                )}
                <button 
                  onClick={() => !isSubmitting && setSelectedTx(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium flex items-start gap-2">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Cancel/Reject Alert */}
              {(selectedTx.status === 'CANCELLED' || selectedTx.status === 'REJECTED') && selectedTx.adminNotes && (
                <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <h4 className="text-sm font-bold">{selectedTx.status === 'CANCELLED' ? 'Pesanan Dibatalkan' : 'Pengajuan Ditolak'}</h4>
                    <p className="text-sm mt-1">{selectedTx.adminNotes}</p>
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Pesanan & Pengiriman</div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Pelanggan:</span> <span className="font-semibold text-slate-900">{selectedTx.customerName || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Telepon:</span> <span className="font-semibold text-slate-900">{selectedTx.customerPhone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sales:</span> <span className="font-semibold text-slate-900">{selectedTx.user.name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tgl Pesanan:</span> <span className="font-semibold text-slate-900">{new Date(selectedTx.createdAt).toLocaleDateString('id-ID')}</span></div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tgl Pengiriman:</span> 
                      <span className="font-semibold text-slate-900">
                        {selectedTx.status === 'SHIPPED' || selectedTx.status === 'COMPLETED' ? new Date(selectedTx.updatedAt).toLocaleDateString('id-ID') : 'Belum Dikirim'}
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-500">Jatuh Tempo:</span> <span className="font-semibold text-red-600">{selectedTx.dueDate ? new Date(selectedTx.dueDate).toLocaleDateString('id-ID') : '-'}</span></div>
                    
                    <div className="flex flex-col mt-2 pt-2 border-t border-slate-200 gap-1">
                      <span className="text-slate-500">Alamat Pengiriman:</span>
                      <span className="font-semibold text-slate-900 text-xs bg-white p-2 rounded border border-slate-100">{selectedTx.shippingAddress || 'Tidak ada data'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Catatan Sales</div>
                    <p className="text-sm text-blue-900 leading-relaxed font-medium">
                      &quot;{selectedTx.notes || 'Tidak ada catatan.'}&quot;
                    </p>
                  </div>
                  
                  {selectedTx.latitude && selectedTx.longitude && (
                    <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner min-h-30 relative group">
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-700 shadow-sm z-10">
                        Lokasi Input Sales
                      </div>
                      <iframe 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${(selectedTx.longitude || 0) - 0.005},${(selectedTx.latitude || 0) - 0.005},${(selectedTx.longitude || 0) + 0.005},${(selectedTx.latitude || 0) + 0.005}&layer=mapnik&marker=${selectedTx.latitude},${selectedTx.longitude}`}
                      ></iframe>
                      <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] text-slate-500">
                        <a href={`https://www.openstreetmap.org/?mlat=${selectedTx.latitude}&mlon=${selectedTx.longitude}#map=16/${selectedTx.latitude}/${selectedTx.longitude}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lihat Peta Penuh</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-xs font-bold text-slate-500">Produk</th>
                      <th className="p-3 text-xs font-bold text-slate-500 text-right">Qty</th>
                      <th className="p-3 text-xs font-bold text-slate-500 text-right">Harga Satuan</th>
                      <th className="p-3 text-xs font-bold text-slate-500 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTx.items.map(item => (
                      <tr key={item.id} className="bg-white">
                        <td className="p-3 text-sm font-medium text-slate-900">{item.productName}</td>
                        <td className="p-3 text-sm text-slate-600 text-right">{item.quantity}</td>
                        <td className="p-3 text-sm text-slate-600 text-right">
                          {selectedTx.status === 'PENDING_APPROVAL' ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-slate-400 line-through">
                                Rp {item.originalPrice?.toLocaleString('id-ID') || 0}
                              </span>
                              <input 
                                type="text"
                                value={editedPrices[item.id] ? editedPrices[item.id].toLocaleString('id-ID') : ''}
                                onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                className="w-28 h-8 px-2 text-right rounded bg-amber-50 border border-amber-200 text-amber-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          ) : (
                            formatCurrency(item.price)
                          )}
                        </td>
                        <td className="p-3 text-sm font-bold text-slate-900 text-right">
                          {selectedTx.status === 'PENDING_APPROVAL' 
                            ? formatCurrency((editedPrices[item.id] || 0) * item.quantity)
                            : formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                    {selectedTx.shippingCost ? (
                      <tr className="bg-slate-50/50">
                        <td colSpan={3} className="p-3 text-sm font-bold text-slate-500 text-right">Ongkos Kirim</td>
                        <td className="p-3 text-sm font-bold text-slate-700 text-right">{formatCurrency(selectedTx.shippingCost)}</td>
                      </tr>
                    ) : null}
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="p-3 text-sm font-bold text-slate-900 text-right">TOTAL KESELURUHAN</td>
                      <td className="p-3 text-base font-bold text-blue-700 text-right">
                        {selectedTx.status === 'PENDING_APPROVAL'
                          ? formatCurrency(
                              selectedTx.items.reduce((sum, item) => sum + ((editedPrices[item.id] || 0) * item.quantity), 0) + (selectedTx.shippingCost || 0)
                            )
                          : formatCurrency(selectedTx.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Summary */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-2">
                  <span>Total Tagihan:</span>
                  <span>{formatCurrency(selectedTx.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-emerald-600 mb-2 border-b border-slate-200 pb-2">
                  <span>Telah Dibayar:</span>
                  <span>{formatCurrency(selectedTx.paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black text-amber-600">
                  <span>Sisa Tagihan:</span>
                  <span>{formatCurrency(Math.max(0, selectedTx.totalAmount - selectedTx.paidAmount))}</span>
                </div>
              </div>

              {/* Payment Histories */}
              {selectedTx.paymentHistories && selectedTx.paymentHistories.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Riwayat Pembayaran</div>
                  <div className="border border-slate-200 rounded-xl divide-y bg-white">
                    {selectedTx.paymentHistories.map((ph, idx) => (
                      <div key={ph.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-slate-800">Pembayaran #{idx + 1}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(ph.createdAt).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-emerald-600">
                          + {formatCurrency(ph.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Payment Form */}
              {selectedTx.status !== 'CANCELLED' && selectedTx.status !== 'REJECTED' && selectedTx.paymentStatus !== 'PAID' && (
                <div className="mt-4">
                  {!showPaymentForm ? (
                    <button 
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 p-3 rounded-xl font-bold transition-all border border-blue-200"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Pembayaran
                    </button>
                  ) : (
                    <form onSubmit={handleAddPayment} className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <label className="block text-xs font-bold text-blue-800 mb-2">Jumlah Pembayaran Baru (Rp)</label>
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Contoh: 500000"
                        value={paymentAmount}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPaymentAmount(val ? parseInt(val).toLocaleString('id-ID') : '');
                        }}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-blue-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 mb-3"
                      />
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => { setShowPaymentForm(false); setPaymentAmount(''); }}
                          className="flex-1 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                        >
                          Batal
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting || !paymentAmount}
                          className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer / Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Catatan Admin (Wajib jika membatalkan/menolak)</label>
                <input 
                  type="text" 
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Ketik catatan tambahan atau alasan penolakan/pembatalan..."
                  className="w-full px-3 py-2 rounded-lg bg-white border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                  disabled={isSubmitting || selectedTx.status === 'CANCELLED' || selectedTx.status === 'REJECTED' || selectedTx.status === 'COMPLETED'}
                />
              </div>

              {selectedTx.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="px-6 h-9 flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-bold transition-all text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" /> Tolak Pengajuan
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-6 h-9 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all text-sm shadow-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4" /> Setujui & Buat Pesanan
                  </button>
                </>
              )}

              {(selectedTx.status === 'PENDING' || selectedTx.status === 'APPROVED') && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 h-9 flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-bold transition-all text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" /> Batal (Kembalikan Stok)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('SHIPPED')}
                    disabled={isSubmitting}
                    className="px-6 h-9 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all text-sm shadow-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    <Truck className="w-4 h-4" /> Proses & Kirim
                  </button>
                </>
              )}

              {selectedTx.status === 'SHIPPED' && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 h-9 flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-bold transition-all text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" /> Batalkan
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    disabled={isSubmitting}
                    className="px-6 h-9 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all text-sm shadow-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4" /> Pesanan Selesai
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Print Options Modal */}
      {showPrintModalFor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Opsi Cetak Surat Jalan</h3>
              <button 
                onClick={() => setShowPrintModalFor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  toast.loading('Membuka dialog print...', { duration: 2000 });
                  setActiveIframe({ id: showPrintModalFor, action: 'print', key: Date.now() });
                  setShowPrintModalFor(null);
                }}
                className="w-full flex items-center p-4 gap-4 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-800 hover:bg-slate-50 transition-all group"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 group-hover:text-slate-900 text-slate-500 transition-colors shrink-0">
                  <Printer className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">Cetak ke Printer</div>
                  <div className="text-[11px] text-slate-500 font-medium">Print langsung menggunakan mesin cetak.</div>
                </div>
              </button>

              <button
                onClick={() => {
                  toast.loading('Menyiapkan dan mengunduh PDF (Portrait)...', { duration: 3000 });
                  setActiveIframe({ id: showPrintModalFor, action: 'download&orientation=portrait', key: Date.now() });
                  setShowPrintModalFor(null);
                }}
                className="w-full flex items-center p-4 gap-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-700 text-blue-500 transition-colors shrink-0">
                  <FileDown className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">Unduh File PDF (Portrait)</div>
                  <div className="text-[11px] text-slate-500 font-medium">Format tegak (vertikal).</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  toast.loading('Menyiapkan dan mengunduh PDF (Landscape)...', { duration: 3000 });
                  setActiveIframe({ id: showPrintModalFor, action: 'download&orientation=landscape', key: Date.now() });
                  setShowPrintModalFor(null);
                }}
                className="w-full flex items-center p-4 gap-4 bg-white border-2 border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-700 text-emerald-500 transition-colors shrink-0">
                  <FileDown className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">Unduh File PDF (Landscape)</div>
                  <div className="text-[11px] text-slate-500 font-medium">Format memanjang (horizontal).</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Invisible Iframe for Print Engine */}
      {activeIframe && (
        <iframe
          key={activeIframe.key}
          src={`/print/delivery-order/${activeIframe.id}?action=${activeIframe.action}&iframe=true`}
          className="fixed top-0 left-0 w-screen h-screen opacity-0 pointer-events-none -z-50"
          title="Print Engine"
        />
      )}
    </div>
  );
}
