'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Clock, AlertTriangle, AlertCircle, Hourglass, MoreHorizontal, CheckCircle2 } from 'lucide-react';

interface RequestItem {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  dueDate: Date | null;
  totalAmount: number;
  status: string;
}

export default function RequestsClient({ requests }: { requests: RequestItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');

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
      <div className="px-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Pengajuan</h2>
        <p className="text-sm text-slate-500">Kelola pengajuan harga dan pesanan tertunda.</p>
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
              <div key={req.id} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-col gap-3 relative overflow-hidden group ${req.status === 'COMPLETED' ? 'opacity-75' : ''}`}>
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
    </div>
  );
}
