'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Store, MapPin, Phone, UserCircle, CalendarDays, Map, X } from 'lucide-react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

export type StoreDetail = {
  id: string;
  name: string;
  ownerName: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  } | null;
};

export function StoresClient({ stores }: { stores: StoreDetail[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreMap, setSelectedStoreMap] = useState<StoreDetail | null>(null);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchSearch = 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.phone && store.phone.includes(searchTerm));
      
      return matchSearch;
    });
  }, [stores, searchTerm]);

  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns: ColumnDef<StoreDetail>[] = [
    {
      id: 'no',
      header: 'No',
      cell: ({ row }) => {
        return <div className="text-sm font-medium text-center">{pageIndex * pageSize + row.index + 1}</div>;
      }
    },
    {
      id: 'storeInfo',
      header: 'Informasi Toko',
      cell: ({ row }) => (
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-1">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-base whitespace-normal wrap-break-word max-w-50">{row.original.name}</p>
            <p className="text-slate-500 flex items-center gap-1 mt-1">
              <UserCircle className="w-4 h-4" />
              {row.original.ownerName}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'contactAddress',
      header: 'Kontak & Alamat',
      cell: ({ row }) => (
        <div className="space-y-2 max-w-xs whitespace-normal wrap-break-word">
          <p className="text-slate-700 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{row.original.address}</span>
          </p>
          {row.original.phone && (
            <p className="text-slate-600 flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              {row.original.phone}
            </p>
          )}
        </div>
      )
    },
    {
      id: 'registeredBy',
      header: 'Didaftarkan Oleh',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
            {row.original.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="whitespace-normal">
            <p className="font-semibold text-slate-900">{row.original.user?.name || 'Unknown User'}</p>
            <p className="text-xs text-slate-500">{row.original.user?.email || '-'}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Daftar',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-600 whitespace-nowrap">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          {new Date(row.original.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <button 
          onClick={() => setSelectedStoreMap(row.original)}
          className="text-sm bg-slate-100 hover:bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 flex items-center gap-2 whitespace-nowrap"
        >
          <Map className="w-4 h-4" /> Lihat Lokasi
        </button>
      )
    }
  ];

  const table = useReactTable({
    data: filteredStores,
    columns,
    pageCount: Math.ceil(filteredStores.length / pageSize),
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Nama Toko, Nama Pemilik, atau No HP..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
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
                      <td key={cell.id} className="p-4 text-sm text-slate-700 align-top">
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
                        <Store className="w-6 h-6 text-slate-400" />
                      </div>
                      <p>Tidak ada toko yang ditemukan.</p>
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

      {/* Map Modal */}
      {selectedStoreMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedStoreMap(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Lokasi: {selectedStoreMap.name}</h2>
                  <p className="text-sm text-slate-500">{selectedStoreMap.address}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStoreMap(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Tutup</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-0 bg-slate-100 relative">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={selectedStoreMap.latitude && selectedStoreMap.longitude 
                  ? `https://maps.google.com/maps?q=${selectedStoreMap.latitude},${selectedStoreMap.longitude}&t=m&z=17&ie=UTF8&iwloc=B&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(selectedStoreMap.address + "+(" + selectedStoreMap.name + ")")}&t=m&z=16&ie=UTF8&iwloc=B&output=embed`
                }
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
               <button 
                onClick={() => setSelectedStoreMap(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
