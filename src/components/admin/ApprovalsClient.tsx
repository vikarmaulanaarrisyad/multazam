'use client';

import React, { useState, useMemo } from 'react';
import { approvePriceRequest, rejectPriceRequest } from '@/actions/approval-actions';
import { AlertCircle, CheckCircle2, XCircle, Package, Search, Printer } from 'lucide-react';
import { DataTable } from '@/components/datatable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';

interface ApprovalItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  originalPrice: number;
  requestedPrice: number;
}

export interface ApprovalTransaction {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  dueDate: Date | null;
  shippingAddress: string | null;
  shippingCost: number | null;
  notes: string | null;
  adminNotes: string | null;
  status: string;
  createdAt: Date;
  user: { name: string | null };
  items: ApprovalItem[];
}

export function ApprovalsClient({ transactions }: { transactions: ApprovalTransaction[] }) {
  const [selectedTx, setSelectedTx] = useState<ApprovalTransaction | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING_APPROVAL');
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const handleOpenModal = (tx: ApprovalTransaction) => {
    setSelectedTx(tx);
    setAdminNotes('');
    setError(null);
    const initialPrices: Record<string, number> = {};
    tx.items.forEach(item => {
      initialPrices[item.id] = item.requestedPrice;
    });
    setEditedPrices(initialPrices);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedTx(null);
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
      approvedPrice: editedPrices[item.id] ?? item.requestedPrice,
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = 
        tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.user.name && tx.user.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchTab = tx.status === activeTab;
      return matchSearch && matchTab;
    });
  }, [transactions, searchTerm, activeTab]);

  const pageCount = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedData = filteredTransactions.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const columns: ColumnDef<ApprovalTransaction>[] = [
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
      id: 'discount',
      header: 'Total Pengajuan',
      cell: ({ row }) => {
        const tx = row.original;
        const totalOriginal = tx.items.reduce((sum, i) => sum + (i.originalPrice * i.quantity), 0);
        const totalRequested = tx.items.reduce((sum, i) => sum + (i.requestedPrice * i.quantity), 0);
        
        return (
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 line-through">Rp {totalOriginal.toLocaleString('id-ID')}</span>
            <span className="text-sm font-bold text-amber-600">Rp {totalRequested.toLocaleString('id-ID')}</span>
          </div>
        );
      }
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'APPROVED') {
          return <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase"><CheckCircle2 className="w-3 h-3 mr-1"/> Disetujui</span>;
        } else if (status === 'REJECTED') {
          return <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase"><XCircle className="w-3 h-3 mr-1"/> Ditolak</span>;
        } else {
          return <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase">Menunggu</span>;
        }
      }
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleOpenModal(row.original)}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          {row.original.status === 'PENDING_APPROVAL' ? 'Tinjau' : 'Detail'}
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Persetujuan Harga</h1>
          <p className="text-sm text-slate-500 mt-1">Tinjau pengajuan diskon dari tim Sales.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button 
          onClick={() => { setActiveTab('PENDING_APPROVAL'); setPagination({ pageIndex: 0, pageSize: 10 }); }}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'PENDING_APPROVAL' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Menunggu ({transactions.filter(t => t.status === 'PENDING_APPROVAL').length})
        </button>
        <button 
          onClick={() => { setActiveTab('APPROVED'); setPagination({ pageIndex: 0, pageSize: 10 }); }}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'APPROVED' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Disetujui ({transactions.filter(t => t.status === 'APPROVED').length})
        </button>
        <button 
          onClick={() => { setActiveTab('REJECTED'); setPagination({ pageIndex: 0, pageSize: 10 }); }}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'REJECTED' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Ditolak ({transactions.filter(t => t.status === 'REJECTED').length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <DataTable
          columns={columns}
          data={paginatedData}
          pageCount={pageCount}
          pagination={{ pageIndex, pageSize }}
          onPaginationChange={setPagination}
          toolbar={
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari invoice atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          }
        />
      </div>

      {/* Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tinjau Pengajuan Harga</h2>
                <p className="text-sm text-slate-500 mt-0.5">{selectedTx.invoiceNumber}</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Pesanan & Pengiriman</div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Pelanggan:</span> <span className="font-semibold text-slate-900">{selectedTx.customerName || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sales:</span> <span className="font-semibold text-slate-900">{selectedTx.user.name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tenggat Waktu:</span> <span className="font-semibold text-slate-900">{selectedTx.dueDate ? new Date(selectedTx.dueDate).toLocaleDateString('id-ID') : '-'}</span></div>
                    <div className="flex flex-col mt-2 pt-2 border-t border-slate-200 gap-1">
                      <span className="text-slate-500">Alamat Pengiriman:</span>
                      <span className="font-semibold text-slate-900 text-xs bg-white p-2 rounded border border-slate-100">{selectedTx.shippingAddress || 'Tidak ada data'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Justifikasi Sales</div>
                  <p className="text-sm text-amber-900 leading-relaxed font-medium">
                    "{selectedTx.notes || 'Tidak ada catatan.'}"
                  </p>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" /> Detail Barang & Harga
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Produk</th>
                        <th className="px-4 py-3 font-semibold text-center">Qty</th>
                        <th className="px-4 py-3 font-semibold text-right">Harga Asli</th>
                        <th className="px-4 py-3 font-semibold text-right">Harga Diajukan</th>
                        <th className="px-4 py-3 font-semibold text-right">Harga Final (Edit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTx.items.map(item => (
                        <tr key={item.id} className="bg-white">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-500">Rp {item.originalPrice.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right font-medium text-amber-600">Rp {item.requestedPrice.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                <input 
                                  type="text"
                                  value={(editedPrices[item.id] || 0).toLocaleString('id-ID')}
                                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                  readOnly={selectedTx.status !== 'PENDING_APPROVAL'}
                                  className={`w-full pl-8 pr-3 py-1.5 border border-blue-200 bg-blue-50 rounded-lg text-right font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${selectedTx.status !== 'PENDING_APPROVAL' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      {selectedTx.shippingCost ? (
                        <tr className="bg-white border-t-2 border-slate-200 font-bold">
                          <td colSpan={2} className="px-4 py-3 text-slate-600">Total Harga Barang</td>
                          <td className="px-4 py-3 text-right text-slate-400 line-through">
                            Rp {selectedTx.items.reduce((s, i) => s + (i.originalPrice * i.quantity), 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600">
                            Rp {selectedTx.items.reduce((s, i) => s + (i.requestedPrice * i.quantity), 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-700 text-lg">
                            Rp {selectedTx.items.reduce((s, i) => s + ((editedPrices[i.id] ?? i.requestedPrice) * i.quantity), 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ) : null}
                      
                      {selectedTx.shippingCost ? (
                        <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                          <td colSpan={4} className="px-4 py-3 text-slate-500">Biaya Ongkos Kirim (Info Tambahan)</td>
                          <td className="px-4 py-3 text-right text-slate-600 text-lg">
                            Rp {Number(selectedTx.shippingCost).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ) : null}

                      {!selectedTx.shippingCost ? (
                        <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                          <td colSpan={2} className="px-4 py-3 text-slate-500">Total Keseluruhan</td>
                          <td className="px-4 py-3 text-right text-slate-400 line-through">
                            Rp {selectedTx.items.reduce((s, i) => s + (i.originalPrice * i.quantity), 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600">
                            Rp {selectedTx.items.reduce((s, i) => s + (i.requestedPrice * i.quantity), 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-700 text-lg">
                            Rp {selectedTx.items.reduce((s, i) => s + ((editedPrices[i.id] ?? i.requestedPrice) * i.quantity), 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ) : null}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Catatan Balasan</label>
                <textarea 
                  value={selectedTx.status === 'PENDING_APPROVAL' ? adminNotes : (selectedTx.adminNotes || '')}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  readOnly={selectedTx.status !== 'PENDING_APPROVAL'}
                  placeholder="Tuliskan catatan atau alasan untuk tim Sales..."
                  className={`w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50 transition-colors ${selectedTx.status !== 'PENDING_APPROVAL' ? 'opacity-70 cursor-not-allowed text-slate-700' : ''}`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center gap-4">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {selectedTx.status === 'PENDING_APPROVAL' ? 'Batal' : 'Tutup'}
              </button>
              {selectedTx.status === 'PENDING_APPROVAL' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" /> Tolak
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Setujui & Simpan
                  </button>
                </div>
              )}
              {selectedTx.status === 'APPROVED' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(`/print/delivery-order/${selectedTx.id}`, '_blank')}
                    className="px-6 py-2.5 bg-slate-800 text-white hover:bg-slate-900 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Printer className="w-5 h-5" /> Cetak Surat Jalan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
