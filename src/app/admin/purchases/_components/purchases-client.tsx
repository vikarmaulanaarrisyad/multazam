'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PurchaseWithRelations } from '@/repositories/purchase.repository';
import { DataTable } from '@/components/datatable/DataTable';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Search, Plus, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithRelations | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<PurchaseWithRelations | null>(null);
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
      id: 'no',
      header: 'No',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-slate-500">
          {(page - 1) * limit + row.index + 1}
        </div>
      ),
    },
    {
      id: 'invoiceNumber',
      header: 'No. Faktur',
      cell: ({ row }: { row: any }) => {
        const purchase = row.original as PurchaseWithRelations;
        return (
          <div>
            <div className="font-semibold text-slate-900">{purchase.invoiceNumber}</div>
            <div className="text-xs text-slate-500">
              {format(new Date(purchase.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
            </div>
          </div>
        );
      },
    },
    {
      id: 'supplier',
      header: 'Supplier',
      cell: ({ row }: { row: any }) => {
        const purchase = row.original as PurchaseWithRelations;
        return <span className="font-medium text-slate-700">{purchase.supplier.name}</span>;
      },
    },
    {
      id: 'item',
      header: 'Item',
      cell: ({ row }: { row: any }) => {
        const purchase = row.original as PurchaseWithRelations;
        return <span className="text-sm text-slate-600">{purchase.items.length} macam barang</span>;
      },
    },
    {
      id: 'total',
      header: 'Total',
      cell: ({ row }: { row: any }) => {
        const purchase = row.original as PurchaseWithRelations;
        return <span className="font-bold text-slate-900">{formatCurrency(purchase.totalAmount)}</span>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        const purchase = row.original as PurchaseWithRelations;
        if (purchase.status === 'COMPLETED') {
          return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Selesai (Stok Masuk)</span>;
        } else if (purchase.status === 'CANCELLED') {
          return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Dibatalkan</span>;
        } else {
          return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Menunggu (Pending)</span>;
        }
      },
    },
    {
      id: 'aksi',
      header: 'Aksi',
      cell: ({ row }: { row: any }) => {
        const purchase = row.original as PurchaseWithRelations;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Lihat Detail"
              onClick={() => {
                setSelectedDetails(purchase);
                setDetailsOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {purchase.status === 'PENDING' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Selesaikan & Masukkan Stok"
                  onClick={() => {
                    setSelectedPurchase(purchase);
                    setConfirmOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Batalkan Pesanan"
                  onClick={() => {
                    setSelectedPurchase(purchase);
                    setCancelOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
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
            placeholder="Cari faktur atau supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </form>

        <Link href="/admin/purchases/create" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Restock Barang
        </Link>
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-150 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan - {selectedDetails?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedDetails && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-slate-700">Tanggal</div>
                  <div className="text-slate-600">{format(new Date(selectedDetails.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Status</div>
                  <div>
                    {selectedDetails.status === 'COMPLETED' ? (
                      <span className="text-green-600 font-medium">Selesai (Stok Masuk)</span>
                    ) : selectedDetails.status === 'CANCELLED' ? (
                      <span className="text-red-600 font-medium">Dibatalkan</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">Pending</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Supplier</div>
                  <div className="text-slate-600">{selectedDetails.supplier.name}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Dibuat Oleh</div>
                  <div className="text-slate-600">{selectedDetails.user.name || selectedDetails.user.email}</div>
                </div>
              </div>

              {selectedDetails.notes && (
                <div className="text-sm bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="font-semibold text-slate-700 mb-1">Catatan Tambahan</div>
                  <div className="text-slate-600 whitespace-pre-wrap">{selectedDetails.notes}</div>
                </div>
              )}

              <div>
                <div className="font-semibold text-slate-700 mb-3 text-sm">Daftar Barang</div>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-4 py-2">Produk</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Harga</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDetails.items.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-2">{item.product.name}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.quantity * Number(item.price))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 font-semibold text-right text-slate-700">Total Biaya</td>
                        <td className="px-4 py-3 font-bold text-right text-blue-600">{formatCurrency(selectedDetails.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
