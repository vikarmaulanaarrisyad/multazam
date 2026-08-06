'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PurchaseWithRelations } from '@/repositories/purchase.repository';
import { DataTable } from '@/components/datatable/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { completePurchaseAction, cancelPurchaseAction } from '@/actions/purchases';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PurchasesClientProps {
  initialData: PurchaseWithRelations[];
  metadata: {
    total: number;
    pageCount: number;
  };
}

export function PurchasesClient({ initialData, metadata }: PurchasesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleComplete = async () => {
    if (!selectedPurchase) return;
    setIsLoading(true);
    try {
      const result = await completePurchaseAction(selectedPurchase.id);
      if (result.success) {
        toast.success(result.message);
        setConfirmOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedPurchase) return;
    setIsLoading(true);
    try {
      const result = await cancelPurchaseAction(selectedPurchase.id);
      if (result.success) {
        toast.success(result.message);
        setCancelOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  const columns = [
    {
      header: 'No. Faktur',
      accessor: (row: PurchaseWithRelations) => (
        <div>
          <div className="font-semibold text-slate-900">{row.invoiceNumber}</div>
          <div className="text-xs text-slate-500">
            {format(new Date(row.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
          </div>
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessor: (row: PurchaseWithRelations) => (
        <span className="font-medium text-slate-700">{row.supplier.name}</span>
      ),
    },
    {
      header: 'Item',
      accessor: (row: PurchaseWithRelations) => (
        <span className="text-sm text-slate-600">{row.items.length} macam barang</span>
      ),
    },
    {
      header: 'Total',
      accessor: (row: PurchaseWithRelations) => (
        <span className="font-bold text-slate-900">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: PurchaseWithRelations) => {
        if (row.status === 'COMPLETED') {
          return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Selesai (Stok Masuk)</span>;
        } else if (row.status === 'CANCELLED') {
          return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Dibatalkan</span>;
        } else {
          return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Menunggu (Pending)</span>;
        }
      },
    },
    {
      header: 'Aksi',
      accessor: (row: PurchaseWithRelations) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'PENDING' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Selesaikan & Masukkan Stok"
                onClick={() => {
                  setSelectedPurchase(row);
                  setConfirmOpen(true);
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Batalkan Pembelian"
                onClick={() => {
                  setSelectedPurchase(row);
                  setCancelOpen(true);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari faktur atau supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </form>

        <Button onClick={() => router.push('/admin/purchases/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Restock Barang
        </Button>
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleComplete}
        loading={isLoading}
        title="Selesaikan Pembelian"
        description={`Apakah Anda yakin ingin menyelesaikan pembelian ${selectedPurchase?.invoiceNumber}? Stok produk akan otomatis ditambahkan dan tidak dapat diubah lagi.`}
      />
      
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancel}
        loading={isLoading}
        title="Batalkan Pembelian"
        description={`Apakah Anda yakin ingin membatalkan pembelian ${selectedPurchase?.invoiceNumber}? Aksi ini tidak dapat diubah.`}
      />
    </div>
  );
}
