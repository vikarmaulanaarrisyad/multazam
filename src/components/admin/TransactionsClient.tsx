'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Truck, Package, X } from 'lucide-react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table';
import { updateTransactionStatus, cancelTransaction } from '@/actions/transaction-actions';
import { cn } from '@/lib/utils';

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
  latitude: number | null;
  longitude: number | null;
  totalAmount: number;
  user: {
    name: string | null;
  };
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    originalPrice: number;
  }[];
};

export function TransactionsClient({ transactions }: { transactions: TransactionDetail[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

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

  const tabs = [
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
      
      return matchSearch && matchTab;
    });
  }, [transactions, searchTerm, activeTab, tabs]);

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
        <button 
          onClick={() => {
            setSelectedTx(row.original);
            setAdminNotes(row.original.adminNotes || '');
            setError(null);
          }}
          className="text-sm bg-slate-100 hover:bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-blue-200"
        >
          Kelola
        </button>
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
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari No. Invoice, Pelanggan, atau Sales..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
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
              <button 
                onClick={() => !isSubmitting && setSelectedTx(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium flex items-start gap-2">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
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
                    <div className="flex justify-between"><span className="text-slate-500">Tenggat Waktu:</span> <span className="font-semibold text-slate-900">{selectedTx.dueDate ? new Date(selectedTx.dueDate).toLocaleDateString('id-ID') : '-'}</span></div>
                    
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
                      "{selectedTx.notes || 'Tidak ada catatan.'}"
                    </p>
                  </div>
                  
                  {selectedTx.latitude && selectedTx.longitude && (
                    <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner min-h-[120px] relative group">
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
                        <td className="p-3 text-sm text-slate-600 text-right">{formatCurrency(item.price)}</td>
                        <td className="p-3 text-sm font-bold text-slate-900 text-right">{formatCurrency(item.price * item.quantity)}</td>
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
                      <td className="p-3 text-base font-bold text-blue-700 text-right">{formatCurrency(selectedTx.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer / Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Catatan Admin (Wajib jika membatalkan)</label>
                <input 
                  type="text" 
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Ketik catatan atau alasan pembatalan..."
                  className="w-full px-3 py-2 rounded-lg bg-white border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                  disabled={isSubmitting}
                />
              </div>

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
    </div>
  );
}
