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
import { Loader2, Trash2, Plus } from 'lucide-react';
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
  const initialPurchasePrice = initialData?.purchasePrice 
    ? formatRupiah(parseFloat(initialData.purchasePrice).toString()) 
    : '';
    
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  const [price, setPrice] = useState(initialPrice);
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice);
  
  const [selectedCategory, setSelectedCategory] = useState<{value: string, label: string} | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<{value: string, label: string} | null>(null);
  const [unitConversions, setUnitConversions] = useState<{fromUnit: string, toUnit: string, conversionQty: number, active: boolean}[]>([]);
  
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
      setPurchasePrice(initialPurchasePrice);
      setUnitConversions(initialData?.unitConversions || []);
    } else {
      setPrice('');
      setPurchasePrice('');
      setSelectedCategory(null);
      setSelectedUnit(null);
      setUnitConversions([]);
    }
  }, [open, initialPrice, initialPurchasePrice, initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code') as string || '',
      name: formData.get('name') as string,
      brand: formData.get('brand') as string || null,
      description: formData.get('description') as string || '',
      price: parseFloat((formData.get('price') as string).replace(/\./g, '').replace(',', '.')) || 0,
      purchasePrice: formData.get('purchasePrice') ? parseFloat((formData.get('purchasePrice') as string).replace(/\./g, '').replace(',', '.')) : null,
      stock: parseInt(formData.get('stock') as string) || 0,
      categoryId: selectedCategory?.value || '',
      unitId: selectedUnit?.value || null,
      purchaseUnit: formData.get('purchaseUnit') as string || null,
      stockBaseUnit: formData.get('stockBaseUnit') as string || null,
      conversionQty: formData.get('conversionQty') ? parseInt(formData.get('conversionQty') as string) : null,
      legacyCode: formData.get('legacyCode') as string || null,
      retailPriceNote: formData.get('retailPriceNote') as string || null,
      unitConversions: unitConversions.map(uc => ({
        ...uc,
        conversionQty: Number(uc.conversionQty)
      })).filter(uc => uc.fromUnit && uc.toUnit && uc.conversionQty > 0),
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
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="code">Kode SKU (Opsional)</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={initialData?.code}
                  placeholder="Kosongkan untuk generate otomatis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  placeholder="Masukkan nama produk..."
                  required
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Merek / Brand (Opsional)</Label>
                <Input
                  id="brand"
                  name="brand"
                  defaultValue={initialData?.brand || ''}
                  placeholder="Contoh: Wings, Indofood..."
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legacyCode">Legacy Code (Opsional)</Label>
                <Input
                  id="legacyCode"
                  name="legacyCode"
                  defaultValue={initialData?.legacyCode || ''}
                  placeholder="Kode pada sistem lama"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga Jual per Satuan Jual (Rp) <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="purchasePrice">Harga Beli per Satuan Beli (Rp)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">Rp</span>
                  </div>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="text"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(formatRupiah(e.target.value))}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
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
                <Label htmlFor="unitId">Satuan Jual (Opsional)</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseUnit">Satuan Beli</Label>
                <Input
                  id="purchaseUnit"
                  name="purchaseUnit"
                  defaultValue={initialData?.purchaseUnit || ''}
                  placeholder="Contoh: DUS"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockBaseUnit">Satuan Dasar</Label>
                <Input
                  id="stockBaseUnit"
                  name="stockBaseUnit"
                  defaultValue={initialData?.stockBaseUnit || ''}
                  placeholder="Contoh: PCS"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversionQty">Qty Konversi</Label>
                <Input
                  id="conversionQty"
                  name="conversionQty"
                  type="number"
                  defaultValue={initialData?.conversionQty ?? ''}
                  placeholder="Contoh: 40"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retailPriceNote">Referensi Harga Ecer</Label>
                <Input
                  id="retailPriceNote"
                  name="retailPriceNote"
                  defaultValue={initialData?.retailPriceNote || ''}
                  placeholder="Misal: Rp12.000 / PCS"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok (Base Unit) <span className="text-red-500">*</span></Label>
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

            {/* Unit Conversions Section */}
            <div className="space-y-4 border-t border-slate-200 pt-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Konversi Unit (Multi-satuan)</Label>
                  <p className="text-xs text-slate-500">Contoh: 1 DUS = 24 PCS</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUnitConversions([...unitConversions, { fromUnit: '', toUnit: '', conversionQty: 1, active: true }])}
                >
                  <Plus className="mr-1 h-3 w-3" /> Tambah
                </Button>
              </div>
              
              {unitConversions.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-md border border-slate-200 border-dashed">
                  <p className="text-sm text-slate-500">Belum ada data konversi unit.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unitConversions.map((uc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input 
                          placeholder="Dari (cth: DUS)" 
                          value={uc.fromUnit}
                          onChange={(e) => {
                            const newConv = [...unitConversions];
                            newConv[index].fromUnit = e.target.value.toUpperCase();
                            setUnitConversions(newConv);
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-500">=</span>
                      <div className="w-24">
                        <Input 
                          type="number"
                          placeholder="Qty" 
                          min="1"
                          value={uc.conversionQty}
                          onChange={(e) => {
                            const newConv = [...unitConversions];
                            newConv[index].conversionQty = parseInt(e.target.value) || 0;
                            setUnitConversions(newConv);
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                          placeholder="Ke (cth: PCS)" 
                          value={uc.toUnit}
                          onChange={(e) => {
                            const newConv = [...unitConversions];
                            newConv[index].toUnit = e.target.value.toUpperCase();
                            setUnitConversions(newConv);
                          }}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const newConv = [...unitConversions];
                          newConv.splice(index, 1);
                          setUnitConversions(newConv);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
