'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SupplierType } from '@/repositories/supplier.repository';
import { DataTable } from '@/components/datatable/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { SupplierForm } from './supplier-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { deleteSupplierAction } from '@/actions/suppliers';
import { toast } from 'sonner';

interface SuppliersClientProps {
  initialData: SupplierType[];
  metadata: {
    total: number;
    pageCount: number;
  };
}

export function SuppliersClient({ initialData, metadata }: SuppliersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierType | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    setIsDeleting(true);
    try {
      const result = await deleteSupplierAction(deletingSupplier.id);
      if (result.success) {
        toast.success(result.message);
        setDeleteOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus data.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Supplier',
      accessor: (row: SupplierType) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.code}</div>
        </div>
      ),
    },
    {
      header: 'Kontak',
      accessor: (row: SupplierType) => (
        <div className="space-y-1 text-sm text-slate-600">
          {row.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> {row.phone}
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> {row.email}
            </div>
          )}
          {!row.phone && !row.email && <span className="text-slate-400 italic">Tidak ada kontak</span>}
        </div>
      ),
    },
    {
      header: 'Alamat',
      accessor: (row: SupplierType) => (
        <span className="text-sm text-slate-600 truncate max-w-[200px] block" title={row.address || ''}>
          {row.address || '-'}
        </span>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: SupplierType) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => {
              setEditingSupplier(row);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setDeletingSupplier(row);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
            placeholder="Cari nama atau kode supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </form>

        <Button onClick={() => {
          setEditingSupplier(null);
          setFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Supplier
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

      <SupplierForm 
        open={formOpen} 
        onOpenChange={setFormOpen}
        supplier={editingSupplier}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Hapus Supplier"
        description={`Apakah Anda yakin ingin menghapus supplier "${deletingSupplier?.name}"? Aksi ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
