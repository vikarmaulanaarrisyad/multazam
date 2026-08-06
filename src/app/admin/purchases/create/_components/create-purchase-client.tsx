'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierType } from '@/repositories/supplier.repository';
import { ProductWithRelations } from '@/types/product.type';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createPurchaseAction } from '@/actions/purchases';
import Select from 'react-select';

interface CreatePurchaseClientProps {
  suppliers: SupplierType[];
  products: ProductWithRelations[];
  userId: string;
}

interface CartItem {
  product: ProductWithRelations;
  quantity: number;
  price: number;
}

export function CreatePurchaseClient({ suppliers, products, userId }: CreatePurchaseClientProps) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [inputPrice, setInputPrice] = useState<number>(0);

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));
  const productOptions = products.map(p => ({ value: p.id, label: p.name, product: p }));

  const handleAddProduct = () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    if (inputQuantity <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    if (inputPrice < 0) {
      toast.error('Harga tidak boleh negatif');
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === selectedProduct.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += inputQuantity;
      // update price if changed? usually we keep the new one or average. Let's just update to new one.
      newCart[existingIndex].price = inputPrice;
      setCart(newCart);
    } else {
      setCart([...cart, { product: selectedProduct, quantity: inputQuantity, price: inputPrice }]);
    }

    setSelectedProduct(null);
    setInputQuantity(1);
    setInputPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'price', value: number) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    setCart(newCart);
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('Silakan pilih supplier');
      return;
    }
    if (cart.length === 0) {
      toast.error('Belum ada produk yang ditambahkan');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createPurchaseAction({
        supplierId,
        userId,
        notes,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      if (result.success) {
        toast.success(result.message);
        router.push('/admin/purchases');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan pada sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Kiri */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Informasi Supplier</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Supplier <span className="text-red-500">*</span></Label>
              <Select
                options={supplierOptions}
                value={supplierOptions.find(o => o.value === supplierId)}
                onChange={(val) => setSupplierId(val?.value || '')}
                placeholder="Cari supplier..."
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan Tambahan</Label>
              <Textarea 
                placeholder="Catatan opsional..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="h-20 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Tambahkan Barang</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="md:col-span-6 space-y-2">
              <Label>Produk</Label>
              <Select
                options={productOptions}
                value={selectedProduct ? { value: selectedProduct.id, label: selectedProduct.name, product: selectedProduct } : null}
                onChange={(val) => {
                  setSelectedProduct(val?.product || null);
                  // Auto fill price from product base price for convenience
                  if (val?.product) {
                    setInputPrice(Number(val.product.price));
                  }
                }}
                placeholder="Cari produk..."
                className="text-sm"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Qty</Label>
              <Input 
                type="number" 
                min="1" 
                value={inputQuantity} 
                onChange={(e) => setInputQuantity(Number(e.target.value))} 
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label>Harga Beli (Satuan)</Label>
              <Input 
                type="number" 
                min="0" 
                value={inputPrice} 
                onChange={(e) => setInputPrice(Number(e.target.value))} 
              />
            </div>
            <div className="md:col-span-1">
              <Button type="button" onClick={handleAddProduct} className="w-full" size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mt-4 border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 w-24">Qty</th>
                  <th className="px-4 py-3 w-40">Harga Beli</th>
                  <th className="px-4 py-3 w-40">Subtotal</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                      Belum ada barang
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr key={idx} className="border-t bg-white">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.product.name}</td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          min="1" 
                          className="h-8 w-20"
                          value={item.quantity} 
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))} 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          min="0" 
                          className="h-8 w-full"
                          value={item.price} 
                          onChange={(e) => handleUpdateItem(idx, 'price', Number(e.target.value))} 
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(item.quantity * item.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ringkasan Kanan */}
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sticky top-20">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Ringkasan Restock</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-slate-600">
              <span>Total Item</span>
              <span className="font-medium text-slate-900">{cart.length} macam</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Kuantitas</span>
              <span className="font-medium text-slate-900">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} pcs
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg text-slate-900">
              <span>Total Biaya</span>
              <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg" 
            onClick={handleSubmit}
            disabled={isLoading || cart.length === 0 || !supplierId}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Buat Pesanan (Pending)
          </Button>
          <p className="text-xs text-center text-slate-500 mt-4">
            Stok barang baru akan bertambah setelah pesanan diselesaikan (Completed) pada menu Pembelian.
          </p>
        </div>
      </div>
    </div>
  );
}
