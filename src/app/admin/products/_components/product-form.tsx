'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { createProductAction, updateProductAction } from '@/actions/products';
import { getCategories } from '@/actions/categories';
import { getUnits } from '@/actions/units';
import { toast } from 'sonner';
import Select from 'react-select';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any; 
}

export function ProductForm({ open, onOpenChange, onSuccess, initialData }: ProductFormProps) {
  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }
    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  };

  const initialPrice = initialData?.price 
    ? formatRupiah(parseFloat(initialData.price).toString()) 
    : '';
    
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  const [price, setPrice] = useState(initialPrice);
  
  const [selectedCategory, setSelectedCategory] = useState<{value: string, label: string} | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<{value: string, label: string} | null>(null);
  
  const isEditing = !!initialData;

  useEffect(() => {
    if (open) {
      getCategories().then(res => {
        if (res.success && res.data) {
          setCategories(res.data);
          if (initialData?.categoryId) {
            const cat = res.data.find((c: any) => c.id === initialData.categoryId);
            if (cat) setSelectedCategory({ value: cat.id, label: cat.name });
          }
        }
      });
      getUnits().then(res => {
        if (res.success && res.data) {
          setUnits(res.data);
          if (initialData?.unitId) {
            const unit = res.data.find((u: any) => u.id === initialData.unitId);
            if (unit) setSelectedUnit({ value: unit.id, label: unit.name });
          }
        }
      });
      setPrice(initialPrice);
    } else {
      setPrice('');
      setSelectedCategory(null);
      setSelectedUnit(null);
    }
  }, [open, initialPrice]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code') as string || '',
      name: formData.get('name') as string,
      description: formData.get('description') as string || '',
      price: parseFloat((formData.get('price') as string).replace(/\./g, '').replace(',', '.')) || 0,
      stock: parseInt(formData.get('stock') as string) || 0,
      categoryId: selectedCategory?.value || '',
      unitId: selectedUnit?.value || null,
    };

    try {
      let res;
      if (isEditing) {
        res = await updateProductAction(initialData.id, data);
      } else {
        res = await createProductAction(data);
      }

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Ubah detail produk yang sudah ada.' 
                : 'Tambahkan produk baru ke dalam sistem inventori.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode / Barcode (Opsional)</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={initialData?.code}
                  placeholder="Kosongkan untuk generate otomatis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk <span className="text-red-500">*</span></Label>
                <textarea
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  placeholder="Masukkan nama produk..."
                  required
                  maxLength={100}
                  rows={2}
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">Rp</span>
                  </div>
                  <Input
                    id="price"
                    name="price"
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(formatRupiah(e.target.value))}
                    placeholder="0"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok Awal <span className="text-red-500">*</span></Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={initialData?.stock ?? ''}
                  placeholder="0"
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategori <span className="text-red-500">*</span></Label>
                <Select
                  id="categoryId"
                  name="categoryId"
                  value={selectedCategory}
                  onChange={(val: any) => setSelectedCategory(val)}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="-- Pilih Kategori --"
                  noOptionsMessage={() => "Kategori tidak ditemukan"}
                  required
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      borderRadius: '0.375rem',
                      borderColor: '#e2e8f0',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#cbd5e1'
                      }
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitId">Satuan (Opsional)</Label>
                <Select
                  id="unitId"
                  name="unitId"
                  value={selectedUnit}
                  onChange={(val: any) => setSelectedUnit(val)}
                  options={units.map((u) => ({ value: u.id, label: u.name }))}
                  placeholder="-- Tidak ada satuan --"
                  isClearable
                  noOptionsMessage={() => "Satuan tidak ditemukan"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      borderRadius: '0.375rem',
                      borderColor: '#e2e8f0',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#cbd5e1'
                      }
                    })
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={initialData?.description || ''}
                placeholder="Detail tambahan produk..."
                maxLength={500}
                rows={3}
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              />
            </div>

          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
