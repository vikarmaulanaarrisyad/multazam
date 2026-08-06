'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/datatable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { CategoryForm } from './category-form';
import { DeleteDialog } from './delete-dialog';
import { getCategoriesPaginated } from '@/actions/categories';

export type CategoryType = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { products: number };
};

export function CategoriesClient() {
  const [data, setData] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);

  // Pagination & Search State
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Gunakan hook debounce khusus atau implementasi debounce sederhana untuk pencarian
  // Karena kita belum menginstall use-debounce, mari buat timer debounce manual:
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset ke halaman pertama saat mencari
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // pageIndex is 0-based in tanstack table, our API is 1-based
    const response = await getCategoriesPaginated(pageIndex + 1, pageSize, debouncedSearch);
    
    if (response.success && response.data && response.metadata) {
      setData(response.data);
      setPageCount(response.metadata.pageCount);
    }
    setLoading(false);
  }, [pageIndex, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cukup atur state modal tanpa memanggil ulang data
  const handleFormChange = (open: boolean) => {
    setFormOpen(open);
  };

  const handleDeleteChange = (open: boolean) => {
    setDeleteOpen(open);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  // Define Columns
  const columns = useMemo<ColumnDef<CategoryType>[]>(
    () => [
      {
        id: 'no',
        header: 'No',
        cell: ({ row }) => (pageIndex * pageSize) + row.index + 1,
        size: 50,
      },
      {
        accessorKey: 'name',
        header: 'Nama Kategori',
      },
      {
        id: 'productsCount',
        header: () => <div className="text-center">Total Produk</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
              {row.original._count.products}
            </span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right pr-4">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-3 pr-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 px-2 flex items-center gap-1.5 hover:bg-slate-50"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-xs text-slate-600">Ubah</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 px-2 flex items-center gap-1.5 hover:bg-red-50 hover:text-red-600 border-slate-200"
              onClick={() => handleDelete(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-red-600">Hapus</span>
            </Button>
          </div>
        ),
      },
    ],
    [pageIndex, pageSize]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori Produk</h1>
          <p className="text-sm text-slate-500">Kelola kategori untuk mengorganisir produk Anda.</p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize }}
        onPaginationChange={setPagination}
        isLoading={loading}
        toolbar={
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari kategori..."
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        }
      />

      <CategoryForm 
        open={formOpen} 
        onOpenChange={handleFormChange} 
        category={selectedCategory} 
        onSuccess={fetchData}
      />

      <DeleteDialog 
        open={deleteOpen} 
        onOpenChange={handleDeleteChange} 
        category={selectedCategory} 
        onSuccess={fetchData}
      />
    </div>
  );
}
