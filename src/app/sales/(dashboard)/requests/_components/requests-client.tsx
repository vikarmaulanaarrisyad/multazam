'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Clock, AlertTriangle, AlertCircle, Hourglass, MoreHorizontal, CheckCircle2, PackageCheck, Loader2, Plus, X, RefreshCw } from 'lucide-react';
import { updateTransactionStatus, addPayment, cancelTransaction } from '@/actions/transaction-actions';
import { toast } from 'sonner';

interface RequestItem {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  dueDate: Date | null;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  shippingCost: number;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    originalPrice: number;
  }[];
  paymentHistories: {
    id: string;
    amount: number;
    createdAt: Date;
  }[];
}

export default function RequestsClient({ requests }: { requests: RequestItem[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleCompleteOrder = async (e: React.MouseEvent, req: RequestItem) => {
    e.stopPropagation();
    if (!confirm('Anda yakin pesanan ini sudah selesai? (Barang sudah diterima pelanggan dan lunas)')) return;
    
    setIsSubmitting(true);
    const result = await updateTransactionStatus({ transactionId: req.id, status: 'COMPLETED' });
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success('Pesanan berhasil diselesaikan');
      setSelectedRequest(null);
    } else {
      toast.error(result.error || 'Gagal menyelesaikan pesanan');
    }
  };

  const handleCancelOrder = async (e: React.MouseEvent, req: RequestItem) => {
    e.stopPropagation();
    if (!confirm('Anda yakin ingin membatalkan pesanan ini? Stok barang akan dikembalikan ke sistem.')) return;
    
    const reason = window.prompt('Masukkan alasan pembatalan pesanan ini:', 'Dibatalkan oleh Sales');
    if (reason === null) return; // User cancelled the prompt
    
    setIsSubmitting(true);
    const result = await cancelTransaction({ transactionId: req.id, adminNotes: reason || 'Dibatalkan oleh Sales' });
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success('Pesanan berhasil dibatalkan dan stok telah dikembalikan');
      setSelectedRequest(null);
    } else {
      toast.error(result.error || 'Gagal membatalkan pesanan');
    }
  };

  const handleAddPayment = async (e: React.FormEvent, req: RequestItem) => {
    e.preventDefault();
    if (!paymentAmount) return;
    
    setIsSubmitting(true);
    const res = await addPayment({
      transactionId: req.id,
      amount: Number(paymentAmount.replace(/\D/g, ''))
    });
    
    if (res.success) {
      toast.success('Pembayaran berhasil dicatat!');
      setPaymentAmount('');
      setShowPaymentForm(false);
      // Let's close modal for simplicity, user can reopen to see updated data
      setSelectedRequest(null);
    } else {
      toast.error(res.error || 'Gagal mencatat pembayaran');
    }
    setIsSubmitting(false);
  };

  const now = new Date();
  // Reset time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter the requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Search filter
      const matchesSearch = 
        req.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.customerName && req.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === 'Semua') return true;
      if (activeTab === 'Menunggu') return req.status === 'PENDING' || req.status === 'PENDING_APPROVAL';
      if (activeTab === 'Disetujui') return req.status === 'APPROVED';
      if (activeTab === 'Selesai/Dikirim') return req.status === 'SHIPPED' || req.status === 'COMPLETED';
      if (activeTab === 'Terlambat') {
        if (!req.dueDate) return false;
        const dueDate = new Date(req.dueDate);
        return dueDate < today && (req.status === 'PENDING' || req.status === 'PENDING_APPROVAL');
      }
      return true;
    });
  }, [requests, searchTerm, activeTab, today]);

  // Calculations for summary cards
  const pendingRequests = requests.filter(req => req.status === 'PENDING' || req.status === 'PENDING_APPROVAL');
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + req.totalAmount, 0);
  
  // Calculate overdue or approaching due (e.g., within 2 days)
  const actionNeededCount = pendingRequests.filter(req => {
    if (!req.dueDate) return false;
    const dueDate = new Date(req.dueDate);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 2; // Overdue or due within 2 days
  }).length;

  return (
    <div className="flex flex-col w-full gap-4 pb-24">
      {/* Header Info */}
      <div className="px-4 pt-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Pengajuan</h2>
          <p className="text-sm text-slate-500">Kelola pengajuan harga dan pesanan tertunda.</p>
        </div>
        <button 
          onClick={() => {
            setIsSubmitting(true);
            router.refresh();
            setTimeout(() => {
              setIsSubmitting(false);
              toast.success('Data berhasil diperbarui');
            }, 1000);
          }}
          disabled={isSubmitting}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm border border-slate-200"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 pt-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            className="w-full h-10 pl-10 pr-4 bg-slate-100 text-slate-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            placeholder="Cari pesanan..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="w-10 h-10 ml-3 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <div className="bg-blue-50 p-3 rounded-2xl flex flex-col justify-between shadow-sm border border-blue-100/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-blue-600 w-4 h-4" />
            <span className="text-xs font-semibold text-blue-800">Total Menunggu</span>
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            Rp {totalPendingAmount.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-blue-600/80 mt-1">{pendingRequests.length} Pesanan</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded-2xl flex flex-col justify-between shadow-sm border border-red-100/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600 w-4 h-4" />
            <span className="text-xs font-semibold text-red-800">Perlu Tindakan</span>
          </div>
          <div className="text-xl font-bold text-red-700">{actionNeededCount}</div>
          <div className="text-xs text-red-600/80 mt-1">Mendekati Tenggat</div>
        </div>
      </div>

      {/* Filters / Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar">
        {['Semua', 'Menunggu', 'Disetujui', 'Selesai/Dikirim', 'Terlambat'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-colors ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 px-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <p className="text-slate-400 text-sm">Tidak ada data pengajuan.</p>
          </div>
        ) : (
          filteredRequests.map(req => {
            let statusColor = "bg-slate-300";
            let tagBg = "bg-slate-100";
            let tagText = "text-slate-600";
            let StatusIcon = MoreHorizontal;
            let statusLabel = "Menunggu";
            let isOverdue = false;

            if (req.dueDate) {
              const dueDate = new Date(req.dueDate);
              if (dueDate < today && (req.status === 'PENDING' || req.status === 'PENDING_APPROVAL')) {
                isOverdue = true;
                statusColor = "bg-red-500";
                tagBg = "bg-red-50";
                tagText = "text-red-600";
                StatusIcon = AlertCircle;
                statusLabel = "Terlambat";
              }
            }

            if (!isOverdue) {
              if (req.status === 'PENDING' || req.status === 'PENDING_APPROVAL') {
                statusColor = "bg-amber-500";
                tagBg = "bg-amber-50";
                tagText = "text-amber-600";
                StatusIcon = Hourglass;
                statusLabel = req.status === 'PENDING_APPROVAL' ? "Persetujuan" : "Menunggu";
              } else if (req.status === 'APPROVED') {
                statusColor = "bg-blue-500";
                tagBg = "bg-blue-50";
                tagText = "text-blue-600";
                StatusIcon = CheckCircle2;
                statusLabel = "Disetujui";
              } else if (req.status === 'SHIPPED') {
                statusColor = "bg-purple-500";
                tagBg = "bg-purple-50";
                tagText = "text-purple-600";
                StatusIcon = CheckCircle2;
                statusLabel = "Dikirim";
              } else if (req.status === 'COMPLETED') {
                statusColor = "bg-green-500";
                tagBg = "bg-green-50";
                tagText = "text-green-600";
                StatusIcon = CheckCircle2;
                statusLabel = "Selesai";
              } else if (req.status === 'REJECTED' || req.status === 'CANCELLED') {
                statusColor = "bg-red-500";
                tagBg = "bg-red-50";
                tagText = "text-red-600";
                StatusIcon = AlertCircle;
                statusLabel = req.status === 'REJECTED' ? "Ditolak" : "Dibatalkan";
              }
            }

            return (
              <div 
                key={req.id} 
                onClick={() => setSelectedRequest(req)}
                className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-col gap-3 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all ${req.status === 'COMPLETED' ? 'opacity-75' : ''}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`}></div>
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <div className="text-[11px] font-mono font-medium text-slate-400 mb-0.5">{req.invoiceNumber}</div>
                    <div className="text-sm font-bold text-slate-900 truncate pr-4">{req.customerName || 'Pelanggan Anonim'}</div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${tagBg} ${tagText} text-[10px] font-bold uppercase tracking-wider`}>
                      <StatusIcon className="w-3 h-3" /> {statusLabel}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-end pl-2 pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 mb-0.5 uppercase tracking-wider">Tenggat Waktu</div>
                    <div className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : (req.status === 'APPROVED' ? 'text-slate-400 line-through' : 'text-slate-600')}`}>
                      {req.dueDate ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(req.dueDate)) : '-'} 
                      {isOverdue && <AlertTriangle className="w-3 h-3" />}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-slate-400 mb-0.5 uppercase tracking-wider">Total Harga</div>
                    <div className="text-sm font-bold text-slate-900">
                      Rp {req.totalAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-100 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedRequest(null)}>
          <div 
            className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex justify-center py-3">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            
            <div className="px-6 pb-2 flex justify-between items-center border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedRequest.invoiceNumber}</h3>
                <p className="text-xs text-slate-500 font-medium">{new Date(selectedRequest.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <AlertCircle className="w-5 h-5 hidden" /> 
                <span className="font-bold text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-safe space-y-6">
              
              {selectedRequest.adminNotes && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Catatan Admin</div>
                  <p className="text-sm text-blue-900 font-medium">
                    &quot;{selectedRequest.adminNotes}&quot;
                  </p>
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Pelanggan</div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-500">Nama Pelanggan</span>
                  <span className="text-sm font-bold text-slate-900">{selectedRequest.customerName || 'Anonim'}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daftar Produk</div>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y bg-white">
                  {selectedRequest.items.map(item => (
                    <div key={item.id} className="p-3">
                      <div className="font-bold text-slate-900 text-sm mb-1">{item.productName}</div>
                      <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-500">{item.quantity} x {item.price.toLocaleString('id-ID')}</div>
                        <div className="text-sm font-bold text-slate-800">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</div>
                      </div>
                      {item.price !== item.originalPrice && (
                        <div className="text-[10px] text-amber-600 font-semibold mt-1">
                          Harga asli: Rp {item.originalPrice.toLocaleString('id-ID')} (Telah dinego)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Subtotal Produk</span>
                  <span className="font-bold text-slate-700">
                    Rp {(selectedRequest.totalAmount - (selectedRequest.shippingCost || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
                {selectedRequest.shippingCost > 0 && (
                  <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2 mt-2">
                    <span className="text-slate-500 font-medium">Ongkos Kirim</span>
                    <span className="font-bold text-slate-700">Rp {selectedRequest.shippingCost.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base pt-3 mt-3 border-t border-slate-200">
                  <span className="text-slate-900 font-extrabold uppercase text-xs">Total Tagihan</span>
                  <span className="font-black text-blue-700 text-lg">Rp {selectedRequest.totalAmount.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2 mt-2">
                  <span className="text-slate-500 font-medium">Telah Dibayar</span>
                  <span className="font-bold text-emerald-600">Rp {selectedRequest.paidAmount.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between items-center text-base pt-3 mt-3 border-t border-slate-200">
                  <span className="text-slate-900 font-extrabold uppercase text-xs">Sisa Tagihan</span>
                  <span className="font-black text-amber-600 text-lg">Rp {Math.max(0, selectedRequest.totalAmount - selectedRequest.paidAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Riwayat Pembayaran */}
              {selectedRequest.paymentHistories && selectedRequest.paymentHistories.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Riwayat Pembayaran</div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y bg-white">
                    {selectedRequest.paymentHistories.map((ph, idx) => (
                      <div key={ph.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-slate-900">Pembayaran #{idx + 1}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {new Date(ph.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-emerald-600">
                          + Rp {ph.amount.toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Tambah Pembayaran */}
              {selectedRequest.status !== 'CANCELLED' && selectedRequest.status !== 'REJECTED' && selectedRequest.paymentStatus !== 'PAID' && (
                <div className="pt-2">
                  {!showPaymentForm ? (
                    <button 
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 p-3.5 rounded-xl font-bold transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Tambah Pembayaran / Cicilan
                    </button>
                  ) : (
                    <form onSubmit={(e) => handleAddPayment(e, selectedRequest)} className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-3">
                      <label className="text-xs font-bold text-blue-800">Jumlah Pembayaran (Rp)</label>
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Contoh: 500000"
                        value={paymentAmount}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPaymentAmount(val ? parseInt(val).toLocaleString('id-ID') : '');
                        }}
                        className="w-full h-11 px-3 rounded-lg bg-white border border-blue-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          type="button"
                          onClick={() => { setShowPaymentForm(false); setPaymentAmount(''); }}
                          className="flex-1 p-2.5 rounded-lg bg-white text-slate-600 font-bold hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                          Batal
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting || !paymentAmount}
                          className="flex-1 p-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                        >
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {selectedRequest.status === 'SHIPPED' && (
                <div className="pt-2">
                  <button 
                    onClick={(e) => handleCompleteOrder(e, selectedRequest)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageCheck className="w-5 h-5" />}
                    Tandai Pesanan Selesai
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-3 px-6">
                    Tekan tombol ini hanya ketika barang sudah diserahkan kepada pelanggan dan pembayaran telah lunas.
                  </p>
                </div>
              )}

              {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'PENDING_APPROVAL') && (
                <div className="pt-2">
                  <button 
                    onClick={(e) => handleCancelOrder(e, selectedRequest)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 p-3.5 rounded-xl font-bold transition-all disabled:opacity-70 border border-red-100"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                    Batalkan Pesanan
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-3 px-6">
                    Stok barang akan otomatis dikembalikan ke sistem jika pesanan dibatalkan.
                  </p>
                </div>
              )}
              
              <div className="h-4"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
