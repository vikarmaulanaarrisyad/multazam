'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, MapPin, List, X, Calendar, User, Store, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { assignVisit } from '@/actions/admin-visit-actions';
import dynamic from 'next/dynamic';
import { DataTable } from '@/components/datatable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

// Dynamically import StoreMap to avoid SSR issues with Leaflet
const StoreMap = dynamic(() => import('./StoreMap'), { 
  ssr: false,
  loading: () => <div className="h-150 w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400">Memuat Peta...</div>
});

interface VisitsAdminClientProps {
  salesUsers: any[];
  allVisits: any[];
  mapLocations: any[];
  initialStoresBySales: Record<string, any[]>;
  officeLocation?: { lat: number; lng: number };
}

export function VisitsAdminClient({ salesUsers, allVisits, mapLocations, initialStoresBySales, officeLocation }: VisitsAdminClientProps) {
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP'>('LIST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [isNewStore, setIsNewStore] = useState(false);
  
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSalesId('');
    setIsNewStore(false);
  };

  const handleAssignVisit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('isNewStore', isNewStore ? 'true' : 'false');
      
      const result = await assignVisit(formData);
      if (result.success) {
        toast.success("Kunjungan berhasil ditugaskan!");
        handleCloseModal();
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // List View Columns
  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'scheduledAt',
      header: 'Tanggal Kunjungan',
      cell: ({ row }) => new Date(row.original.scheduledAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    },
    {
      accessorKey: 'salesName',
      header: 'Sales',
    },
    {
      accessorKey: 'storeName',
      header: 'Toko',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-1 text-xs font-semibold rounded-full",
          row.original.status === 'COMPLETED' ? "bg-green-100 text-green-700" :
          row.original.status === 'CANCELLED' ? "bg-red-100 text-red-700" :
          "bg-blue-100 text-blue-700"
        )}>
          {row.original.status}
        </span>
      )
    },
    {
      accessorKey: 'address',
      header: 'Alamat',
      cell: ({ row }) => <span className="text-xs max-w-50 truncate block" title={row.original.address}>{row.original.address}</span>
    }
  ], []);

  const filteredVisits = allVisits.filter(v => 
    v.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.salesName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full gap-6">
      
      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kunjungan Sales</h2>
          <p className="text-sm text-slate-500">Pantau dan tugaskan rute kunjungan sales.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>Tugaskan Kunjungan</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('LIST')}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all", activeTab === 'LIST' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900")}
        >
          <List className="w-4 h-4" />
          Daftar Kunjungan
        </button>
        <button
          onClick={() => setActiveTab('MAP')}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all", activeTab === 'MAP' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900")}
        >
          <MapPin className="w-4 h-4" />
          Peta Lokasi
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'LIST' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                className="w-full h-11 pl-10 pr-4 bg-slate-50 text-slate-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-slate-200" 
                placeholder="Cari nama toko atau sales..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredVisits}
            pageCount={1} // Client side filtering for simplicity in this view
            pagination={{ pageIndex: 0, pageSize: filteredVisits.length || 10 }}
            onPaginationChange={() => {}}
          />
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <StoreMap locations={mapLocations} officeLocation={officeLocation} />
        </div>
      )}

      {/* Assign Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden mt-10 md:mt-0">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Penugasan Kunjungan Sales</h3>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAssignVisit} className="p-6 space-y-5">
              {/* Pilih Sales */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sales yang Ditugaskan</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select 
                    name="salesId" 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={selectedSalesId}
                    onChange={(e) => {
                      setSelectedSalesId(e.target.value);
                      setIsNewStore(false);
                    }}
                  >
                    <option value="">-- Pilih Sales --</option>
                    {salesUsers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pilih Toko */}
              {selectedSalesId && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-slate-700">Toko / Lokasi Kunjungan</label>
                    <button 
                      type="button"
                      onClick={() => setIsNewStore(!isNewStore)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      {isNewStore ? "Pilih dari toko yang sudah ada" : "+ Tambah Toko Baru"}
                    </button>
                  </div>
                  
                  {!isNewStore ? (
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <select 
                        name="storeId" 
                        required={!isNewStore} 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="">-- Pilih Toko --</option>
                        {initialStoresBySales[selectedSalesId] && initialStoresBySales[selectedSalesId].length > 0 && (
                          <optgroup label="Toko Milik Sales Ini">
                            {initialStoresBySales[selectedSalesId].map(store => (
                              <option key={store.id} value={store.id}>{store.name} ({store.address})</option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Toko Lain (Lintas Sales)">
                          {Object.entries(initialStoresBySales)
                            .filter(([salesId]) => salesId !== selectedSalesId)
                            .flatMap(([_, stores]) => stores)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(store => (
                              <option key={store.id} value={store.id}>{store.name} ({store.address})</option>
                            ))
                          }
                        </optgroup>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <p className="text-xs font-semibold text-blue-800 mb-2">Input Data Toko Baru</p>
                      <input type="text" name="storeName" required placeholder="Nama Toko" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <input type="text" name="ownerName" required placeholder="Nama Pemilik" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <input type="text" name="phone" placeholder="No HP (Opsional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <textarea name="address" required placeholder="Alamat Lengkap" rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"></textarea>
                      <div className="flex gap-2">
                        <input type="number" step="any" name="latitude" placeholder="Latitude (Opsional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <input type="number" step="any" name="longitude" placeholder="Longitude (Opsional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Kunjungan</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="datetime-local" 
                    name="scheduledAt" 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
              
              {/* Catatan */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea 
                  name="notes" 
                  rows={2}
                  placeholder="Misal: Tagih hutang bulan lalu, tawarkan produk X..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Tugaskan Kunjungan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
