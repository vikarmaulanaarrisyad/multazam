'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DataTable } from '@/components/datatable/DataTable';

export default function ReturnsClient({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = data.filter(r => 
    r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      header: 'Pelanggan',
      accessorKey: 'customerName',
      cell: (row: any) => <span className="font-medium">{row.customerName}</span>
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
      header: 'Item',
      accessorKey: 'items',
      cell: (row: any) => (
        <div className="text-sm">
          {row.items.length} item
        </div>
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
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari nomor retur atau pelanggan..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/sales/returns/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Buat Retur Baru
          </Button>
        </Link>
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
              <h3 className="text-sm font-medium text-slate-900">Belum ada retur</h3>
              <p className="text-sm text-slate-500 mt-1">Anda belum pernah membuat transaksi retur.</p>
              <Link href="/sales/returns/new">
                <Button variant="outline" className="mt-4">
                  Buat Retur Sekarang
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
