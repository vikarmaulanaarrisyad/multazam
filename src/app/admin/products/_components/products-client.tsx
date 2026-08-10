'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search as SearchIcon, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/datatable/DataTable';
import { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { ProductForm } from './product-form';
import { DeleteDialog } from './delete-dialog';
import { ImportExcelDialog } from './import-excel-dialog';
import { getProductsPaginated, deleteManyProducts } from '@/actions/products';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProductWithRelations } from '@/types/product.type';

export function ProductsClient() {
  const [activeTab, setActiveTab] = useState('master');
  const [data, setData] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  
  // For ProductForm editing (needs the full object or enough data)
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);

  // Row Selection
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeletingMany, setIsDeletingMany] = useState(false);

  // Pagination & Search State
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductsPaginated(pageIndex + 1, pageSize, debouncedSearch);
      if (res.success && res.data) {
        setData(res.data);
        setPageCount(res.metadata?.pageCount || 0);
      } else {
        toast.error(res.message || 'Gagal memuat data produk');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan pada sistem');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    setIsDeletingMany(true);
    try {
      const res = await deleteManyProducts(selectedIds);
      if (res.success) {
        toast.success(res.message);
        setRowSelection({});
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus data massal');
    } finally {
      setIsDeletingMany(false);
    }
  };

  const columns = useMemo<ColumnDef<ProductWithRelations>[]>(() => {
    const commonCols: ColumnDef<ProductWithRelations>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'code',
        header: 'Kode SKU',
        cell: ({ row }) => <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">{row.original.code}</span>
      },
      {
        accessorKey: 'name',
        header: 'Nama Produk',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-slate-500 line-clamp-1">{row.original.description}</p>
            )}
          </div>
        )
      }
    ];

    const actionsCol: ColumnDef<ProductWithRelations> = {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setEditingProduct(product);
                setFormOpen(true);
              }}
              className="h-8 border-slate-200 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4 text-slate-600" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedProduct({ id: product.id, name: product.name });
                setDeleteOpen(true);
              }}
              className="h-8 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    };

    if (activeTab === 'master') {
      return [
        ...commonCols,
        {
          accessorKey: 'category.name',
          header: 'Kategori',
          cell: ({ row }) => row.original.category?.name || '-'
        },
        {
          accessorKey: 'stock',
          header: 'Stok (Base Unit)',
          cell: ({ row }) => {
            const stock = row.original.stock;
            const unitName = row.original.unit?.name || row.original.stockBaseUnit || '';
            
            let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
            if (stock < 10) badgeColor = "bg-red-100 text-red-800 border-red-200";
            else if (stock < 30) badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
            
            return (
              <div className="flex items-center gap-2">
                <span className="font-semibold">{stock}</span>
                <span className="text-xs text-slate-500">{unitName}</span>
                {stock < 10 && (
                  <span className={`ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded-full border ${badgeColor}`}>
                    <AlertCircle className="w-3 h-3 mr-1 inline-block" /> Tipis
                  </span>
                )}
              </div>
            );
          }
        },
        actionsCol
      ];
    } else if (activeTab === 'conversion') {
      return [
        ...commonCols,
        {
          accessorKey: 'purchaseUnit',
          header: 'Unit Beli',
          cell: ({ row }) => row.original.purchaseUnit || '-'
        },
        {
          accessorKey: 'stockBaseUnit',
          header: 'Base Unit',
          cell: ({ row }) => row.original.stockBaseUnit || '-'
        },
        {
          accessorKey: 'unitConversions',
          header: 'Konversi Aktif',
          cell: ({ row }) => {
            const conversions = row.original.unitConversions || [];
            const active = conversions.filter(c => c.active);
            if (active.length === 0) return <span className="text-slate-400 text-sm">Tidak ada</span>;
            return (
              <div className="flex flex-col gap-1">
                {active.map(c => (
                  <span key={c.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 w-fit whitespace-nowrap">
                    {c.fromUnit} ➔ {c.conversionQty} {c.toUnit}
                  </span>
                ))}
              </div>
            );
          }
        },
        actionsCol
      ];
    } else {
      return [
        ...commonCols,
        {
          accessorKey: 'purchasePrice',
          header: 'Harga Beli/Dus',
          cell: ({ row }) => {
            const amount = parseFloat(row.original.purchasePrice?.toString() || '0');
            return <span className="font-medium text-slate-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}</span>;
          }
        },
        {
          accessorKey: 'price',
          header: 'Harga Jual/Dus',
          cell: ({ row }) => {
            const amount = parseFloat(row.original.price.toString());
            return <span className="font-medium text-slate-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}</span>;
          }
        },
        {
          accessorKey: 'retailPriceNote',
          header: 'Ref Ecer',
          cell: ({ row }) => row.original.retailPriceNote || '-'
        },
        {
          accessorKey: 'legacyCode',
          header: 'Legacy Code',
          cell: ({ row }) => row.original.legacyCode || '-'
        },
        actionsCol
      ];
    }
  }, [activeTab]);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Produk</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data produk, harga, stok, dan klasifikasi di dalam sistem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-10 bg-white"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          <Button 
            className="h-10" 
            onClick={() => {
              setEditingProduct(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedCount > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <span className="text-sm font-medium text-primary ml-2">
            {selectedCount} produk dipilih
          </span>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            disabled={isDeletingMany}
            className="shadow-sm"
          >
            {isDeletingMany ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Hapus Terpilih
          </Button>
        </div>
      )}

      {/* Filters & Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Tabs & Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col gap-4 bg-slate-50/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-auto p-1 bg-slate-200/50">
              <TabsTrigger value="master" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">PRODUCT MASTER</TabsTrigger>
              <TabsTrigger value="conversion" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">UNIT CONVERSION</TabsTrigger>
              <TabsTrigger value="price" className="py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">PRICE MASTER</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:max-w-xs mt-2 sm:mt-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Cari nama atau kode produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="relative">
          <DataTable 
            columns={columns} 
            data={data}
            pageCount={pageCount}
            pagination={{ pageIndex, pageSize }}
            onPaginationChange={setPagination}
            isLoading={loading}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </div>

      {/* Modals */}
      <ProductForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSuccess={loadData}
        initialData={editingProduct}
      />
      
      {selectedProduct && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onSuccess={loadData}
          product={selectedProduct}
        />
      )}

      <ImportExcelDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
