'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DataTable } from '@/components/datatable/DataTable';
import { approveReturn, rejectReturn } from '@/actions/return-actions';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AdminReturnsClient({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = data.filter(r => 
    r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async () => {
    if (!selectedReturn || !actionType) return;
    setLoading(true);
    
    try {
      let res;
      if (actionType === 'APPROVE') {
        res = await approveReturn(selectedReturn.id, adminNotes);
      } else {
        res = await rejectReturn(selectedReturn.id, adminNotes);
      }

      if (res.success) {
        toast.success(`Retur berhasil di${actionType === 'APPROVE' ? 'setujui' : 'tolak'}`);
        setSelectedReturn(null);
        setActionType(null);
        setAdminNotes('');
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'No. Retur',
      accessorKey: 'returnNumber',
      cell: (row: any) => (
        <div>
          <p className="font-semibold text-slate-900">{row.returnNumber}</p>
          <p className="text-xs text-slate-500">{format(new Date(row.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}</p>
        </div>
      )
    },
    {
      header: 'Sales',
      accessorKey: 'user.name',
      cell: (row: any) => <span className="font-medium text-slate-700">{row.user.name || 'Sales'}</span>
    },
    {
      header: 'Toko',
      accessorKey: 'customerName',
      cell: (row: any) => <span>{row.customerName}</span>
    },
    {
      header: 'Tipe',
      accessorKey: 'type',
      cell: (row: any) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.type === 'EXCHANGE' ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' : 'text-orange-600 bg-orange-50'}`}>
          {row.type === 'EXCHANGE' ? 'Tukar Guling' : 'Refund'}
        </span>
      )
    },
    {
      header: 'Total Item',
      accessorKey: 'items',
      cell: (row: any) => (
        <div className="text-sm font-semibold">{row.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} Pcs</div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        const variants: any = {
          PENDING: { color: 'bg-amber-100 text-amber-700', label: 'Menunggu' },
          APPROVED: { color: 'bg-green-100 text-green-700', label: 'Disetujui' },
          REJECTED: { color: 'bg-red-100 text-red-700', label: 'Ditolak' },
          COMPLETED: { color: 'bg-blue-100 text-blue-700', label: 'Selesai' }
        };
        const st = variants[row.status];
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${st.color}`}>{st.label}</span>;
      }
    },
    {
      header: 'Aksi',
      accessorKey: 'actions',
      cell: (row: any) => {
        if (row.status !== 'PENDING') return <span className="text-slate-400 text-xs italic">Selesai</span>;
        
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => { setSelectedReturn(row); setActionType('APPROVE'); }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> Setujui
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => { setSelectedReturn(row); setActionType('REJECT'); }}
            >
              <XCircle className="h-4 w-4 mr-1" /> Tolak
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Cari no. retur, sales, toko..." 
          className="pl-9 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">Belum ada pengajuan retur</h3>
              <p className="text-sm text-slate-500 mt-1">Pengajuan retur dari tim sales akan muncul di sini.</p>
            </div>
          }
        />
      </div>

      <Dialog open={!!selectedReturn} onOpenChange={() => { setSelectedReturn(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVE' ? 'Setujui Retur' : 'Tolak Retur'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'APPROVE' 
                ? 'Stok akan disesuaikan otomatis setelah disetujui (Barang bagus dikurangi, barang rusak ditambah).'
                : 'Pengajuan retur ini akan dibatalkan.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedReturn && (
              <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-2">
                <p><span className="font-medium text-slate-500">No. Retur:</span> {selectedReturn.returnNumber}</p>
                <p><span className="font-medium text-slate-500">Sales:</span> {selectedReturn.user?.name}</p>
                <p><span className="font-medium text-slate-500">Keterangan:</span> {selectedReturn.notes || '-'}</p>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium text-slate-900 mb-2">Item Retur:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedReturn.items.map((i: any, idx: number) => (
                      <li key={idx}>
                        {i.product?.name} x {i.quantity} ({i.condition === 'BAD' ? 'Rusak/Basi' : 'Utuh'})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Admin (Opsional)</label>
              <Textarea 
                placeholder="Tambahkan catatan untuk sales..." 
                value={adminNotes} 
                onChange={e => setAdminNotes(e.target.value)} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedReturn(null)}>Batal</Button>
            <Button 
              className={actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} 
              onClick={handleAction}
              disabled={loading}
            >
              {actionType === 'APPROVE' ? 'Ya, Setujui' : 'Ya, Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
