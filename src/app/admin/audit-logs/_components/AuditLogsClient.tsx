'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ShieldAlert, ArrowRight, ArrowLeft, Search, Calendar, Filter, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuditLogsClient({ initialData, pagination }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  // Debounce search term to prevent excessive requests
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');

    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');

    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');

    // Reset to page 1 when filters change (unless only page changed)
    const currentSearch = searchParams.get('search') || '';
    const currentStart = searchParams.get('startDate') || '';
    const currentEnd = searchParams.get('endDate') || '';
    
    if (debouncedSearch !== currentSearch || startDate !== currentStart || endDate !== currentEnd) {
       params.set('page', '1');
    }

    router.push(`?${params.toString()}`);
  }, [debouncedSearch, startDate, endDate, router, searchParams]);

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    router.push('?page=1');
  };

  const getActionColor = (action: string) => {
    switch(action.toUpperCase()) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'LOGIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-indigo-600" />
            Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">Merekam semua jejak aktivitas penting pada sistem untuk keamanan dan transparansi.</p>
        </div>
      </div>

      {/* Filter Top Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all"
            placeholder="Cari aksi, entitas, atau nama user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center text-slate-400 font-bold px-2">-</div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" /> Reset Filter
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Waktu</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Aksi</th>
                <th className="px-6 py-4">Entitas</th>
                <th className="px-6 py-4">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialData.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
                    {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{log.user?.name || 'Sistem'}</div>
                    <div className="text-xs text-slate-500">{log.user?.role}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{log.entityType}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 max-w-30 truncate" title={log.entityId}>{log.entityId}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {log.details}
                  </td>
                </tr>
              ))}
              
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Filter className="w-12 h-12 mb-4 text-slate-200" />
                      <p className="text-lg font-medium text-slate-500">Tidak ada log yang ditemukan</p>
                      <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian atau rentang tanggal.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-500">
              Menampilkan Halaman <span className="font-bold text-slate-900">{pagination.page}</span> dari <span className="font-bold text-slate-900">{pagination.totalPages}</span>
              {' '} ({pagination.total} Total Data)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
