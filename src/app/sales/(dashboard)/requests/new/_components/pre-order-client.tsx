'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, UserCircle, Package, Send, CheckCircle2, ChevronLeft, Minus, Plus, Search, ChevronDown } from 'lucide-react';
import { createPreOrder } from '@/actions/sales-orders';
import { Product } from '@/generated/prisma/client';
import { cn } from '@/lib/utils';

interface PreOrderClientProps {
  stores: any[];
}

export function PreOrderClient({ stores }: PreOrderClientProps) {
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState<{product: Product, quantity: number, requestedPrice?: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedStoreId, setSelectedStoreId] = useState<string>('NEW');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const [formData, setFormData] = useState<any>({
    customerName: '',
    ownerName: '',
    customerPhone: '',
    shippingAddress: '',
    shippingCost: '',
    dpAmount: '',
    dueDate: '',
    notes: ''
  });
  const [isFormLoaded, setIsFormLoaded] = useState(false);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    if (storeId === 'NEW') {
      setFormData((prev: any) => ({
        ...prev,
        customerName: '',
        customerPhone: '',
        shippingAddress: ''
      }));
    } else {
      const store = stores.find(s => s.id === storeId);
      if (store) {
        setFormData((prev: any) => ({
          ...prev,
          customerName: store.name,
          customerPhone: store.phone || '',
          shippingAddress: store.address || ''
        }));
      }
    }
  };

  useEffect(() => {
    if (isFormLoaded) {
      sessionStorage.setItem('preOrderFormData', JSON.stringify(formData));
    }
  }, [formData, isFormLoaded]);

  useEffect(() => {
    // Load cart from session storage
    const stored = sessionStorage.getItem('preOrderCart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed.map(item => ({
            ...item,
            requestedPrice: item.requestedPrice || Number(item.product.price)
          })));
        } else {
          router.push('/sales/products');
        }
      } catch (e) {
        console.error('Failed to parse cart', e);
        router.push('/sales/products');
      }
    } else {
      router.push('/sales/products');
    }
    
    // Load form data
    const storedForm = sessionStorage.getItem('preOrderFormData');
    let loadedForm: any = null;
    if (storedForm) {
      try {
        loadedForm = JSON.parse(storedForm);
        // Only set if we actually have data, otherwise let the default take over
        if (loadedForm.customerName || loadedForm.customerPhone || loadedForm.notes) {
          setFormData((prev: any) => ({
            ...prev,
            ...loadedForm
          }));
        }
      } catch (e) {
        console.error('Failed to parse form data', e);
      }
    }
    
    // Set default due date to 1 week if empty
    if (!loadedForm || !loadedForm.dueDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setFormData((prev: any) => ({
        ...prev,
        dueDate: prev.dueDate || nextWeek.toISOString().split('T')[0]
      }));
    }
    
    setIsFormLoaded(true);
    setIsLoading(false);
  }, [router]);

  const updateQuantity = (index: number, change: number) => {
    setCartItems(prev => {
      const newItems = [...prev];
      const newQty = newItems[index].quantity + change;
      
      if (newQty <= 0) {
        newItems.splice(index, 1);
        if (newItems.length === 0) {
          router.push('/sales/products');
        }
      } else if (newQty <= newItems[index].product.stock) {
        newItems[index].quantity = newQty;
      }
      
      sessionStorage.setItem('preOrderCart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const updateRequestedPrice = (index: number, newPrice: number) => {
    setCartItems(prev => {
      const newItems = [...prev];
      newItems[index].requestedPrice = newPrice;
      sessionStorage.setItem('preOrderCart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const handleAddMore = () => {
    router.push('/sales/products');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    let lat: number | undefined;
    let lng: number | undefined;

    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        throw new Error("Geolocation tidak didukung browser ini");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError("Izin lokasi diperlukan untuk mengirim pengajuan. Harap aktifkan GPS dan izinkan browser mengakses lokasi.");
      return;
    }
    
    try {
      const result = await createPreOrder({
        customerName: formData.customerName,
        ownerName: formData.ownerName,
        customerPhone: formData.customerPhone,
        shippingAddress: formData.shippingAddress,
        shippingCost: formData.shippingCost ? Number(formData.shippingCost.replace(/\D/g, '')) : undefined,
        dpAmount: formData.dpAmount ? Number(formData.dpAmount.replace(/\D/g, '')) : undefined,
        dueDate: new Date(formData.dueDate),
        notes: formData.notes,
        latitude: lat,
        longitude: lng,
        clonedFromId: formData.clonedFromId,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.requestedPrice || Number(item.product.price),
          originalPrice: Number(item.product.price)
        }))
      });
      
      if (result.success) {
        setIsSuccess(true);
        sessionStorage.removeItem('preOrderCart');
        sessionStorage.removeItem('preOrderFormData');
        router.refresh();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.error || 'Failed to create pre-order');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getEceranPrice = (product: any): number | null => {
    if (!product.retailPriceNote) return null;
    const match = product.retailPriceNote.match(/[\d.,]+/);
    if (match) {
      const rawNum = match[0].replace(/[.,]/g, '');
      const num = parseInt(rawNum, 10);
      if (!isNaN(num)) return num;
    }
    return null;
  };

  const totalOriginal = cartItems.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);
  const totalRequested = cartItems.reduce((total, item) => total + ((item.requestedPrice || Number(item.product.price)) * item.quantity), 0);
  
  const isPriceProposal = cartItems.some(item => {
    const requested = item.requestedPrice || Number(item.product.price);
    const kartonPrice = Number(item.product.price);
    const eceranPrice = getEceranPrice(item.product);
    
    if (requested < kartonPrice) {
      if (eceranPrice !== null && requested === eceranPrice) {
        return false; // Not a proposal, just buying retail
      }
      return true; // Lower than karton and not eceran -> proposal
    }
    return false;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat keranjang...</div>;
  }

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Tag className="text-blue-700 w-4 h-4" />
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">Buat Pengajuan</span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">
        
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-emerald-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Pengajuan Berhasil!</h2>
            <p className="text-slate-500 text-sm mb-8">
              Pengajuan pre-order Anda telah dikirim untuk persetujuan. Anda dapat melacak statusnya di menu Pengajuan.
            </p>
            <button 
              onClick={() => router.push('/sales/requests')}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors active:scale-95"
            >
              Lihat Daftar Pengajuan
            </button>
          </div>
        ) : (
          <>
            <div className={cn("rounded-xl p-4 border", isPriceProposal ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100")}>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {isPriceProposal ? "Pengajuan Harga Khusus" : "Pengajuan Pre-Order Baru"}
              </h2>
              <p className="text-sm text-slate-600">
                {isPriceProposal 
                  ? "Anda sedang mengajukan harga khusus. Formulir ini akan diteruskan ke Admin untuk persetujuan." 
                  : "Isi detail di bawah ini untuk mengirimkan pre-order baru untuk pelanggan."}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Customer Details */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 uppercase tracking-wider">
                    <UserCircle className="w-5 h-5" />
                    Pelanggan
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => router.push('/sales/new-order')}
                    className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    Ganti Toko
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Toko / Pelanggan</span>
                    <span className="text-sm font-bold text-slate-900">{formData.customerName || '-'}</span>
                  </div>
                  {formData.ownerName && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pemilik</span>
                      <span className="text-sm font-medium text-slate-700">{formData.ownerName}</span>
                    </div>
                  )}
                  {(formData.customerPhone) && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Telepon</span>
                      <span className="text-sm font-medium text-slate-700">{formData.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Details */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Send className="w-5 h-5" />
                  Detail Pengiriman
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500" htmlFor="shippingAddress">Alamat Lengkap</label>
                    <textarea 
                      id="shippingAddress"
                      placeholder="Masukkan alamat pengiriman..."
                      value={formData.shippingAddress}
                      onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
                      className="w-full h-20 p-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all border"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500" htmlFor="shippingCost">Biaya Ongkir (opsional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                      <input 
                        id="shippingCost"
                        type="text" 
                        placeholder="0"
                        value={formData.shippingCost}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, shippingCost: val ? parseInt(val).toLocaleString('id-ID') : ''});
                        }}
                        className="w-full h-11 pl-9 pr-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Package className="w-5 h-5" />
                  Pilihan Produk
                </h3>
                <div className="flex flex-col gap-3">
                  {cartItems.map((item, index) => (
                    <div key={item.product.id} className="flex flex-col gap-3 p-3 bg-slate-50 rounded-xl relative overflow-hidden group border border-slate-100">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl opacity-50"></div>
                      
                      <div className="flex justify-between items-start pl-2">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                          <span className="text-sm font-bold text-slate-900 truncate">{item.product.name}</span>
                          <span className="text-[11px] font-medium text-slate-500">SKU: {item.product.code}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Harga Karton (Asli)</span>
                          <span className={cn(
                            "text-sm font-bold text-slate-900",
                            item.requestedPrice && item.requestedPrice < Number(item.product.price) && "line-through opacity-50 text-xs"
                          )}>
                            {formatCurrency(Number(item.product.price))}
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick Price Selectors */}
                      <div className="flex items-center justify-end gap-1.5 pl-2 -mt-1 mb-2">
                        <button
                          type="button"
                          onClick={() => updateRequestedPrice(index, Number(item.product.price))}
                          className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded border transition-colors shadow-sm",
                            (item.requestedPrice === Number(item.product.price) || !item.requestedPrice)
                              ? "bg-blue-600 text-white border-blue-600" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          Karton
                        </button>
                        {getEceranPrice(item.product) !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              const eceranPrice = getEceranPrice(item.product);
                              if (eceranPrice !== null) {
                                updateRequestedPrice(index, eceranPrice);
                              }
                            }}
                            className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded border transition-colors shadow-sm",
                              item.requestedPrice === getEceranPrice(item.product)
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            )}
                          >
                            Eceran ({(item.product as any).retailPriceNote})
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1 pl-2">
                        <span className="text-xs font-bold text-slate-500">Jumlah:</span>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(index, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          {(() => {
                            let unitString = (item.product as any).unit?.name || '';
                            const eceran = getEceranPrice(item.product);
                            if (eceran !== null && item.requestedPrice === eceran) {
                              const match = (item.product as any).retailPriceNote?.match(/[a-zA-Z]+/);
                              if (match) unitString = match[0].toUpperCase();
                            }
                            return (
                              <span className="min-w-8 px-1 text-center font-bold text-sm text-slate-900 whitespace-nowrap">
                                {item.quantity} {unitString}
                              </span>
                            );
                          })()}
                          <button 
                            type="button"
                            onClick={() => updateQuantity(index, 1)}
                            disabled={item.quantity >= item.product.stock}
                            className={cn(
                              "w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                              item.quantity >= item.product.stock 
                                ? "bg-slate-100 text-slate-400 opacity-50" 
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                            )}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-1 bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-3 transition-colors focus-within:ring-1 focus-within:ring-blue-300 shadow-sm ml-2">
                        <label className="text-[11px] font-bold text-slate-600 pl-1 whitespace-nowrap">Harga Pengajuan</label>
                        <div className="flex items-center gap-1.5 w-32">
                          <span className="text-xs font-bold text-slate-400">Rp</span>
                          <input 
                            type="number" 
                            min="0"
                            required
                            value={item.requestedPrice === 0 ? '' : item.requestedPrice}
                            onChange={e => updateRequestedPrice(index, Number(e.target.value))}
                            className="w-full bg-transparent border-none outline-none font-bold text-sm text-right text-blue-700 p-0 m-0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  type="button"
                  onClick={handleAddMore}
                  className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 rounded-xl transition-colors border border-dashed border-blue-200"
                >
                  <Plus className="w-4 h-4" />
                  Add More Products
                </button>
              </div>

              {/* Payment & Timeline */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Package className="w-5 h-5" />
                  Pembayaran & Waktu
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500" htmlFor="dueDate">Jatuh Tempo Pembayaran</label>
                    <input 
                      id="dueDate"
                      type="date" 
                      required
                      readOnly
                      value={formData.dueDate}
                      className="w-full h-11 px-3 rounded-lg bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed border"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500" htmlFor="dpAmount">Uang Muka / DP (Opsional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                      <input 
                        id="dpAmount"
                        type="text" 
                        placeholder="0"
                        value={formData.dpAmount}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, dpAmount: val ? parseInt(val).toLocaleString('id-ID') : ''});
                        }}
                        className="w-full h-11 pl-9 pr-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500" htmlFor="notes">
                      {isPriceProposal ? "Alasan (Wajib)" : "Catatan Tambahan (Opsional)"}
                    </label>
                    <textarea 
                      id="notes"
                      rows={3}
                      required={isPriceProposal}
                      placeholder={isPriceProposal ? "Alasan mengapa mengajukan harga ini..." : "Tambahkan catatan tambahan jika ada..."}
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full p-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="mt-4 pb-4">
                <div className={cn(
                  "rounded-2xl shadow-sm p-4 flex flex-col gap-3 text-white border",
                  isPriceProposal ? "bg-amber-600 border-amber-700" : "bg-slate-900 border-slate-700"
                )}>
                  {isPriceProposal && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/20">
                      <span className="text-xs text-white/80 font-medium">Total Asli:</span>
                      <span className="text-sm font-bold opacity-80 line-through">{formatCurrency(totalOriginal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/90 font-medium">
                      {isPriceProposal ? "Nilai Diajukan:" : "Total Nilai Estimasi:"}
                    </span>
                    <span className="text-lg font-bold text-white">{formatCurrency(totalRequested + (formData.shippingCost ? Number(formData.shippingCost.replace(/\D/g, '')) : 0))}</span>
                  </div>
                  {formData.dpAmount && (
                    <>
                      <div className="flex justify-between items-center border-t border-white/20 pt-2">
                        <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                          Uang Muka (DP):
                        </span>
                        <span className="text-sm font-bold text-emerald-300">
                          - {formatCurrency(Number(formData.dpAmount.replace(/\D/g, '')))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/20 pt-2">
                        <span className="text-xs text-white/90 font-bold uppercase tracking-wider">
                          Sisa Tagihan:
                        </span>
                        <span className="text-lg font-black text-amber-300">
                          {formatCurrency((totalRequested + (formData.shippingCost ? Number(formData.shippingCost.replace(/\D/g, '')) : 0)) - Number(formData.dpAmount.replace(/\D/g, '')))}
                        </span>
                      </div>
                    </>
                  )}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-[0.98] disabled:opacity-70 text-sm",
                      isPriceProposal ? "bg-white text-amber-700 hover:bg-slate-50" : "bg-blue-600 text-white hover:bg-blue-500"
                    )}
                  >
                    {isSubmitting ? (
                      <div className={cn("w-5 h-5 border-2 border-t-transparent rounded-full animate-spin", isPriceProposal ? "border-amber-700" : "border-white")}></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {isPriceProposal ? "Ajukan Persetujuan Harga" : "Kirim Pre-Order"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
