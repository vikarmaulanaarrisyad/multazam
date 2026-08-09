'use client';

import React from 'react';
import { Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { markVisitCompleted } from '@/actions/visits';

interface VisitItem {
  id: string;
  storeName: string;
  scheduledAt: string; // ISO string
  address: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
}

export default function VisitsClient({ visits }: { visits: VisitItem[] }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const filteredVisits = React.useMemo(() => {
    return visits.filter(v =>
      v.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visits, searchTerm]);

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

  return (
    <div className="flex flex-col w-full gap-4 pb-24">
      <div className="px-4 pt-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Daftar Kunjungan</h2>
        <input
          className="h-10 px-4 bg-slate-100 rounded-xl focus:outline-none"
          placeholder="Cari kunjungan..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 px-4">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed">
            <p className="text-slate-400">Tidak ada kunjungan.</p>
          </div>
        ) : (
          filteredVisits.map(v => (
            <div key={v.id} className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-800">{v.storeName}</p>
                <p className="text-xs text-slate-500">{new Date(v.scheduledAt).toLocaleString('id-ID')}</p>
                <p className="text-sm text-slate-700 mt-1">{v.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  v.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' :
                  v.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                  'bg-red-50 text-red-600'
                }`}>{{
                  SCHEDULED: 'Terjadwal',
                  COMPLETED: 'Selesai',
                  CANCELLED: 'Batal'
                }[v.status]}</span>
                {v.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleMarkCompleted(v.id)}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Selesai
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
