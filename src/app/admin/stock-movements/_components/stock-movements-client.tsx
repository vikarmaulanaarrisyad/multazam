'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { StockMovementWithProduct } from '@/repositories/stock-movement.repository';
import { DataTable } from '@/components/datatable/DataTable';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StockMovementsClientProps {
  initialData: StockMovementWithProduct[];
  metadata: {
    total: number;
    pageCount: number;
  };
}

export function StockMovementsClient({ initialData, metadata }: StockMovementsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('search', searchTerm);
      params.set('page', '1');
    } else {
      params.delete('search');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePaginationChange = (updater: any) => {
    const newState = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;
    const params = new URLSearchParams(searchParams);
    params.set('page', (newState.pageIndex + 1).toString());
    params.set('limit', newState.pageSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const columns = [
    {
      id: 'no',
      header: 'No',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-slate-500">
          {(page - 1) * limit + row.index + 1}
        </div>
      ),
    },
    {
      id: 'waktu',
      header: 'Waktu',
      cell: ({ row }: { row: any }) => format(new Date(row.original.createdAt), 'dd MMM yyyy, HH:mm', { locale: id }),
    },
    {
      id: 'produk',
      header: 'Produk',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <div>
            <div className="font-medium text-slate-900">{movement.product.name}</div>
            <div className="text-xs text-slate-500">{movement.product.code}</div>
          </div>
        );
      },
    },
    {
      id: 'tipe',
      header: 'Tipe',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        if (movement.type === 'IN') {
          return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Masuk</span>;
        } else if (movement.type === 'OUT') {
          return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Keluar</span>;
        } else {
          return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Penyesuaian</span>;
        }
      },
    },
    {
      id: 'jumlah',
      header: 'Jumlah',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <span className={`font-semibold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
            {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
          </span>
        );
      },
    },
    {
      id: 'sisa_stok',
      header: 'Sisa Stok',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <span className="text-slate-600 font-medium">
            {movement.balanceAfter}
          </span>
        );
      },
    },
    {
      id: 'keterangan',
      header: 'Keterangan',
      cell: ({ row }: { row: any }) => {
        const movement = row.original as StockMovementWithProduct;
        return (
          <div className="text-sm">
            <div className="text-slate-900">{movement.reference || '-'}</div>
            {movement.notes && <div className="text-xs text-slate-500">{movement.notes}</div>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari nama atau kode produk..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <DataTable
          columns={columns}
          data={initialData}
          pageCount={metadata.pageCount}
          pagination={{ pageIndex: page - 1, pageSize: limit }}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </div>
  );
}
