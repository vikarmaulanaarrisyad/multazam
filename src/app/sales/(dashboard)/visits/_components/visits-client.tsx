'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle, Search, MapPin, Navigation, Store, Map as MapIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { markVisitCompleted } from '@/actions/visits';
import { cn } from '@/lib/utils';

interface VisitItem {
  id: string;
  storeName: string;
  scheduledAt: string; // ISO string
  address: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
}

export default function VisitsClient({ visits }: { visits: VisitItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'PENDING'>('ALL');

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const matchesSearch = v.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' || 
                            (filterStatus === 'SCHEDULED' && v.status === 'SCHEDULED') ||
                            (filterStatus === 'COMPLETED' && v.status === 'COMPLETED') ||
                            (filterStatus === 'PENDING' && v.status === 'CANCELLED'); // Map CANCELLED to PENDING visually for now if needed, or omit
      return matchesSearch && matchesFilter;
    });
  }, [visits, searchTerm, filterStatus]);

  const handleMarkCompleted = async (visitId: string) => {
    setIsSubmitting(true);
    try {
      const response = await markVisitCompleted(visitId);
      if (response.success) {
        toast.success('Kunjungan ditandai selesai');
      } else {
        toast.error(response.error || 'Gagal menandai kunjungan');
      }
    } catch (error) {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate a simple next 5 days for the date selector
  const days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dayStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      isActive: i === 0
    };
  });

  return (
    <div className="flex flex-col w-full pb-24 bg-slate-50 min-h-screen">
      
      {/* Date Selector & Search & Filters - Sticky Header */}
      <div className="px-4 pt-4 pb-4 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-40 shadow-sm border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Jadwal Kunjungan</h2>
        
        {/* Date Selector */}
        <div className="flex gap-3 overflow-x-auto snap-x pb-2 [&::-webkit-scrollbar]:hidden">
          {days.map((d, i) => (
            <div 
              key={i} 
              className={cn(
                "snap-start shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-xl cursor-pointer transition-all active:scale-95",
                d.isActive 
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" 
                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className="text-[10px] uppercase font-medium opacity-90">{d.dayStr}</span>
              <span className="text-lg font-bold mt-0.5">{d.dateNum}</span>
            </div>
          ))}
          <div className="snap-start shrink-0 flex items-center justify-center w-12 h-16 rounded-xl bg-white border border-slate-200 text-slate-500 cursor-pointer transition-all hover:bg-slate-50 active:scale-95">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 text-slate-900 rounded-full text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-sm" 
            placeholder="Cari toko atau alamat..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {(['ALL', 'SCHEDULED', 'COMPLETED'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilterStatus(f)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                filterStatus === f 
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {f === 'ALL' ? `Semua (${visits.length})` : f === 'SCHEDULED' ? 'Terjadwal' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {/* Visit Timeline */}
      <div className="px-4 flex flex-col gap-2 pt-4 relative">
        
        {/* Timeline Line (Only show if there are visits) */}
        {filteredVisits.length > 0 && (
          <div className="absolute left-10 top-6 bottom-4 w-0.5 bg-slate-200 z-0"></div>
        )}

        {filteredVisits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 mt-4 shadow-sm z-10">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada jadwal kunjungan.</p>
          </div>
        ) : (
          filteredVisits.map((v, index) => {
            const dateObj = new Date(v.scheduledAt);
            const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={v.id} className={cn("flex gap-3 relative z-10 transition-all", v.status === 'COMPLETED' ? 'opacity-70' : '')}>
                
                {/* Time Column */}
                <div className="w-16 shrink-0 flex flex-col items-center pt-3">
                  <span className="text-sm font-bold text-slate-900">{timeStr}</span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">WIB</span>
                </div>

                {/* Timeline Dot */}
                <div className={cn(
                  "w-3 h-3 rounded-full shrink-0 mt-4 relative -ml-6 mr-2.5 shadow-[0_0_0_4px_rgba(248,250,252,1)]",
                  v.status === 'COMPLETED' ? "bg-green-500" : "bg-blue-600"
                )}></div>

                {/* Card Content */}
                <div className="grow bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base text-slate-900 leading-tight">{v.storeName}</h3>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      v.status === 'SCHEDULED' ? "bg-blue-50 text-blue-600" :
                      v.status === 'COMPLETED' ? "bg-green-50 text-green-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {v.status === 'SCHEDULED' ? 'TERJADWAL' : v.status === 'COMPLETED' ? 'SELESAI' : 'BATAL'}
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 mb-3 text-slate-500">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="text-sm line-clamp-2">{v.address}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-4 text-slate-500">
                    <Navigation className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium">GPS Ready</span>
                    <span className="mx-1 text-[10px]">•</span>
                    <Store className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium truncate">{v.notes || 'Reguler'}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2 pt-3 border-t border-slate-100">
                    <button className="flex-1 h-9 flex items-center justify-center bg-slate-100 text-slate-700 font-medium text-sm rounded-full hover:bg-slate-200 transition-colors">
                      Detail
                    </button>
                    {v.status === 'SCHEDULED' ? (
                      <button
                        onClick={() => handleMarkCompleted(v.id)}
                        disabled={isSubmitting}
                        className="flex-[1.5] h-9 flex items-center justify-center gap-2 bg-blue-600 text-white font-medium text-sm rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                        Check-in
                      </button>
                    ) : (
                      <button disabled className="flex-[1.5] h-9 flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-medium text-sm rounded-full cursor-not-allowed">
                        <CheckCircle className="w-4 h-4" /> Selesai
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* End of Day Marker */}
        {filteredVisits.length > 0 && (
          <div className="flex gap-3 relative z-10 mt-2 pb-8">
            <div className="w-16 shrink-0"></div>
            <div className="w-3 h-3 rounded-full bg-slate-200 shrink-0 relative -ml-6 mr-2.5"></div>
            <div className="text-xs text-slate-400 -mt-1 uppercase font-bold tracking-widest">Akhir Rute</div>
          </div>
        )}

      </div>
    </div>
  );
}
