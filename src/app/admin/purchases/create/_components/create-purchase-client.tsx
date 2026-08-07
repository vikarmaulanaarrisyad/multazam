'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierType } from '@/repositories/supplier.repository';
import { ProductWithRelations } from '@/types/product.type';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, Search, Keyboard } from 'lucide-react';
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
  originalQty: number;
  originalUnit: string;
  originalPrice: number;
  multiplier: number;
}

export function CreatePurchaseClient({ suppliers, products, userId }: CreatePurchaseClientProps) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const supplierSelectRef = useRef<any>(null);
  const productSelectRef = useRef<any>(null);
  
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [inputUnit, setInputUnit] = useState<string>('Pcs');
  const [inputMultiplier, setInputMultiplier] = useState<number>(1);
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

    if (inputMultiplier <= 0) {
      toast.error('Isi per satuan harus lebih dari 0');
      return;
    }

    const finalQuantity = inputQuantity * inputMultiplier;
    const finalPrice = inputPrice / inputMultiplier; // price per basic unit

    const existingIndex = cart.findIndex(item => item.product.id === selectedProduct.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += finalQuantity;
      newCart[existingIndex].price = finalPrice;
      newCart[existingIndex].originalQty += inputQuantity;
      newCart[existingIndex].originalUnit = inputUnit;
      newCart[existingIndex].originalPrice = inputPrice;
      newCart[existingIndex].multiplier = inputMultiplier;
      setCart(newCart);
    } else {
      setCart([...cart, { 
        product: selectedProduct, 
        quantity: finalQuantity, 
        price: finalPrice,
        originalQty: inputQuantity,
        originalUnit: inputUnit,
        originalPrice: inputPrice,
        multiplier: inputMultiplier
      }]);
    }

    setSelectedProduct(null);
    setInputQuantity(1);
    setInputPrice(0);
    setInputUnit('Pcs');
    setInputMultiplier(1);
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
    
    let finalNotes = notes;
    const conversionNotes = cart
      .filter(c => c.multiplier > 1)
      .map(c => `- ${c.product.name}: ${c.originalQty} ${c.originalUnit} @ ${formatCurrency(c.originalPrice)} (Konversi ke ${c.quantity} ${c.product.unit?.name || 'Pcs'})`)
      .join('\n');
      
    if (conversionNotes) {
      finalNotes = finalNotes ? `${finalNotes}\n\nCatatan Pembelian Asli:\n${conversionNotes}` : `Catatan Pembelian Asli:\n${conversionNotes}`;
    }

    try {
      const result = await createPurchaseAction({
        supplierId,
        userId,
        notes: finalNotes,
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter to submit
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      
      // Alt + S to focus Supplier
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        supplierSelectRef.current?.focus();
      }
      
      // Alt + P to focus Product
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        productSelectRef.current?.focus();
      }
      
      // Alt + A to add product
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleAddProduct();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [supplierId, cart, selectedProduct, inputQuantity, inputPrice, inputUnit, inputMultiplier, notes]);

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
                ref={supplierSelectRef}
                options={supplierOptions}
                value={supplierOptions.find(o => o.value === supplierId)}
                onChange={(val) => setSupplierId(val?.value || '')}
                placeholder="Cari supplier (Alt+S)..."
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
          
          <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                ref={productSelectRef}
                options={productOptions}
                value={selectedProduct ? { value: selectedProduct.id, label: selectedProduct.name, product: selectedProduct } : null}
                onChange={(val) => {
                  setSelectedProduct(val?.product || null);
                  if (val?.product) {
                    setInputPrice(Number(val.product.price));
                    setInputUnit(val.product.unit?.name || 'Pcs');
                    setInputMultiplier(1);
                  }
                }}
                placeholder="Cari produk (Alt+P)..."
                className="text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label>Qty Beli</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={inputQuantity} 
                  onChange={(e) => setInputQuantity(Number(e.target.value))} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProduct();
                    }
                  }}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>Satuan Beli</Label>
                <Input 
                  type="text" 
                  value={inputUnit} 
                  onChange={(e) => setInputUnit(e.target.value)} 
                  placeholder="Misal: Dus, Box, Pcs..."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Isi per Satuan</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={inputMultiplier} 
                  onChange={(e) => setInputMultiplier(Number(e.target.value))} 
                  title="Berapa kuantitas asli isi 1 satuan tersebut?"
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <Label>Harga Beli (per {inputUnit || 'Satuan'})</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={inputPrice} 
                  onChange={(e) => setInputPrice(Number(e.target.value))} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProduct();
                    }
                  }}
                />
              </div>
              <div className="md:col-span-1">
                <Button type="button" onClick={handleAddProduct} className="w-full" size="icon" title="Tambah Barang (Alt+A atau Enter)">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {inputMultiplier > 1 && (
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
                Informasi: Barang ini akan dihitung sebagai <strong>{inputQuantity * inputMultiplier} {selectedProduct?.unit?.name || 'Pcs'}</strong> ke dalam stok, dengan harga satuan sebesar <strong>{formatCurrency(inputPrice / inputMultiplier)}</strong> per {selectedProduct?.unit?.name || 'Pcs'}.
              </div>
            )}
          </div>

          <div className="mt-4 border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 w-28">Qty (Asli)</th>
                  <th className="px-4 py-3 w-40">Harga Satuan Asli</th>
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
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.product.name}</div>
                        {item.multiplier > 1 && (
                          <div className="text-xs text-slate-500">Beli: {item.originalQty} {item.originalUnit} (isi {item.multiplier}) @ {formatCurrency(item.originalPrice)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            min="1" 
                            className="h-8 w-20 text-xs"
                            value={item.quantity} 
                            onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))} 
                          />
                          <span className="text-xs text-slate-500">{item.product.unit?.name || 'Pcs'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          min="0" 
                          className="h-8 w-full text-xs"
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
            title="Buat Pesanan (Ctrl+Enter)"
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Buat Pesanan (Ctrl+Enter)
          </Button>
          <p className="text-xs text-center text-slate-500 mt-4">
            Stok barang baru akan bertambah setelah pesanan diselesaikan (Completed) pada menu Pembelian.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Shortcut Keyboard
            </h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex justify-between items-center">
                <span>Cari Supplier</span>
                <kbd className="px-2 py-1 bg-slate-100 border rounded text-slate-700 font-mono text-[10px] font-semibold">Alt + S</kbd>
              </li>
              <li className="flex justify-between items-center">
                <span>Cari Produk</span>
                <kbd className="px-2 py-1 bg-slate-100 border rounded text-slate-700 font-mono text-[10px] font-semibold">Alt + P</kbd>
              </li>
              <li className="flex justify-between items-center">
                <span>Tambah ke Keranjang</span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-slate-100 border rounded text-slate-700 font-mono text-[10px] font-semibold">Enter</kbd>
                  <span className="text-[10px]">/</span>
                  <kbd className="px-2 py-1 bg-slate-100 border rounded text-slate-700 font-mono text-[10px] font-semibold">Alt + A</kbd>
                </span>
              </li>
              <li className="flex justify-between items-center">
                <span>Buat Pesanan</span>
                <kbd className="px-2 py-1 bg-slate-100 border rounded text-slate-700 font-mono text-[10px] font-semibold">Ctrl + Enter</kbd>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
