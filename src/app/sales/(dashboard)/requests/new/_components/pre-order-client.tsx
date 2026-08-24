'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, UserCircle, Package, Send, CheckCircle2, ChevronLeft, Minus, Plus, Search, ChevronDown, Lock, WifiOff, History } from 'lucide-react';
import { createPreOrder, getLastPurchasedPrices } from '@/actions/sales-orders';
import { Product } from '@/generated/prisma/client';
import { cn } from '@/lib/utils';
import { saveOfflineOrder } from '@/lib/offline-sync';
import { toast } from 'sonner';

interface PreOrderClientProps {
  stores: any[];
}

export function PreOrderClient({ stores }: PreOrderClientProps) {
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState<{product: Product, quantity: number, requestedPrice?: number, unitNote?: string}[]>([]);
  const [lastPurchasedPrices, setLastPurchasedPrices] = useState<Record<string, { price: number; date: string; unitNote?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
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
    paymentMethod: 'CASH',
    dueDate: '',
    deliveryDate: '',
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
    if (formData.customerName && formData.customerName.trim().length > 0) {
      getLastPurchasedPrices(formData.customerName).then(res => {
        if (res && res.success && res.data) {
          setLastPurchasedPrices(res.data);
        }
      }).catch(err => console.error('Failed to load last purchased prices', err));
    } else {
      setLastPurchasedPrices({});
    }
  }, [formData.customerName]);

  useEffect(() => {
    // Load cart from session storage
    const stored = sessionStorage.getItem('preOrderCart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed.map(item => {
            let initialUnitNote = item.unitNote;
            if (!initialUnitNote) {
              initialUnitNote = (item.product as any).purchaseUnit || (item.product as any).unit?.name || 'Karton';
              const eceran = getEceranPrice(item.product);
              if (eceran !== null && (item.requestedPrice === eceran || !item.requestedPrice)) {
                // If it's empty, we just default to Karton.
              }
            }
            return {
              ...item,
              requestedPrice: item.requestedPrice || Number(item.product.price),
              unitNote: initialUnitNote
            };
          }));
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
    
    if (!loadedForm || !loadedForm.dueDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFormData((prev: any) => ({
        ...prev,
        dueDate: prev.dueDate || nextWeek.toISOString().split('T')[0],
        deliveryDate: prev.deliveryDate || tomorrow.toISOString().split('T')[0]
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
        newItems[index] = { ...newItems[index], quantity: newQty };
      }
      
      sessionStorage.setItem('preOrderCart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const setQuantity = (index: number, newQty: number) => {
    setCartItems(prev => {
      const newItems = [...prev];
      if (newQty < 0) return prev;
      newItems[index] = { ...newItems[index], quantity: Math.min(newQty, newItems[index].product.stock) };
      sessionStorage.setItem('preOrderCart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const updateRequestedPrice = (index: number, newPrice: number, newUnitNote?: string, shouldClamp: boolean = false) => {
    setCartItems(prev => {
      const newItems = [...prev];
      const targetProduct = newItems[index].product;
      const minP = getMinPrice(targetProduct);
      
      let effectivePrice = newPrice;
      const effectiveUnitNote = newUnitNote || newItems[index].unitNote;
      const isEceran = effectiveUnitNote && effectiveUnitNote !== 'Karton' && effectiveUnitNote !== (targetProduct as any).purchaseUnit;

      // Clamping rule: Only clamp if explicitly requested (e.g. onBlur or submit), NOT on active typing keystroke
      if (shouldClamp && !isEceran && minP !== null && effectivePrice > 0 && effectivePrice < minP) {
        effectivePrice = minP;
      }

      newItems[index] = { 
        ...newItems[index], 
        requestedPrice: effectivePrice,
        ...(newUnitNote ? { unitNote: newUnitNote } : {})
      };
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

    // 1. Try Geolocation if online/supported
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }
    } catch (err: any) {
      // If offline or GPS timeout, proceed without lat/lng fallback so offline orders aren't blocked
      console.warn('Geolocation unavailable or timed out, proceeding without GPS tags');
    }
    
    const preOrderPayload = {
      customerName: formData.customerName,
      ownerName: formData.ownerName,
      customerPhone: formData.customerPhone,
      shippingAddress: formData.shippingAddress,
      shippingCost: formData.shippingCost ? Number(formData.shippingCost.replace(/\D/g, '')) : undefined,
      dpAmount: formData.dpAmount ? Number(formData.dpAmount.replace(/\D/g, '')) : undefined,
      paymentMethod: formData.paymentMethod,
      dueDate: new Date(formData.dueDate),
      deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
      notes: formData.notes,
      latitude: lat,
      longitude: lng,
      clonedFromId: formData.clonedFromId,
      items: cartItems.map(item => {
        const minP = getMinPrice(item.product);
        const effectiveUnitNote = item.unitNote || (item.product as any).purchaseUnit || (item.product as any).unit?.name || 'Karton';
        const isEceran = effectiveUnitNote !== 'Karton' && effectiveUnitNote !== (item.product as any).purchaseUnit;
        let finalPrice = item.requestedPrice || Number(item.product.price);
        if (!isEceran && minP !== null && finalPrice > 0 && finalPrice < minP) {
          finalPrice = minP;
        }
        return {
          productId: item.product.id,
          quantity: item.quantity,
          price: finalPrice,
          originalPrice: Number(item.product.price),
          unitNote: effectiveUnitNote
        };
      })
    };

    // 2. Check offline mode
    if (typeof window !== 'undefined' && !navigator.onLine) {
      saveOfflineOrder(preOrderPayload);
      setIsOfflineSaved(true);
      setIsSuccess(true);
      sessionStorage.removeItem('preOrderCart');
      sessionStorage.removeItem('preOrderFormData');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. Online submission with offline catch fallback
    try {
      const result = await createPreOrder(preOrderPayload);
      
      if (result.success) {
        setIsOfflineSaved(false);
        setIsSuccess(true);
        sessionStorage.removeItem('preOrderCart');
        sessionStorage.removeItem('preOrderFormData');
        router.refresh();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.error || 'Gagal mengirimkan pre-order');
      }
    } catch (err: any) {
      // If network request failed (e.g. signal lost mid-submit)
      if (err.message && (err.message.includes('fetch') || err.message.includes('network') || !navigator.onLine)) {
        saveOfflineOrder(preOrderPayload);
        setIsOfflineSaved(true);
        setIsSuccess(true);
        sessionStorage.removeItem('preOrderCart');
        sessionStorage.removeItem('preOrderFormData');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(err.message || 'Terjadi kesalahan saat mengirim pengajuan');
      }
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

  const getMinPrice = (product: any): number | null => {
    if (product && product.minPrice !== undefined && product.minPrice !== null) {
      const num = Number(product.minPrice);
      if (!isNaN(num) && num > 0) return num;
    }
    return null;
  };

  const getEceranPrice = (product: any): number | null => {
    if (!product.retailPriceNote) return null;
    const match = product.retailPriceNote.match(/\d[\d.,]*/);
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
    <div className="flex flex-col w-full pb-8">
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
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              isOfflineSaved ? "bg-amber-100" : "bg-emerald-100"
            )}>
              {isOfflineSaved ? (
                <WifiOff className="text-amber-600 w-8 h-8" />
              ) : (
                <CheckCircle2 className="text-emerald-600 w-8 h-8" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isOfflineSaved ? "Pesanan Tersimpan Offline!" : "Pengajuan Berhasil!"}
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              {isOfflineSaved
                ? "Koneksi internet terputus/offline. Pre-order Anda telah tersimpan aman di HP dan akan otomatis dikirim ke server saat internet kembali terhubung."
                : "Pengajuan pre-order Anda telah dikirim untuk persetujuan. Anda dapat melacak statusnya di menu Pengajuan."}
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
                          onClick={() => updateRequestedPrice(index, Number(item.product.price), (item.product as any).purchaseUnit || (item.product as any).unit?.name || 'Karton')}
                          className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded border transition-colors shadow-sm",
                            (item.requestedPrice === Number(item.product.price) || !item.requestedPrice)
                              ? "bg-blue-600 text-white border-blue-600" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          {(item.product as any).purchaseUnit || 'Karton'}
                        </button>
                        {getEceranPrice(item.product) !== null && getEceranPrice(item.product)! > 0 &&
                         (item.product as any).salesMode !== 'WHOLESALE_ONLY' && 
                         (item.product as any).allowUnitSale !== false && 
                         (!(item.product as any).retailEndDate || new Date((item.product as any).retailEndDate) >= new Date()) && (
                          <button
                            type="button"
                            onClick={() => {
                              const eceranPrice = getEceranPrice(item.product);
                              if (eceranPrice !== null) {
                                let eceranUnit = 'Eceran';
                                const match = (item.product as any).retailPriceNote?.match(/[a-zA-Z]+/);
                                if (match) eceranUnit = match[0].toUpperCase();
                                updateRequestedPrice(index, eceranPrice, eceranUnit);
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
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max={item.product.stock}
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                if (!isNaN(val)) setQuantity(index, val);
                              }}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val <= 0) {
                                  setCartItems(prev => {
                                    const newItems = [...prev];
                                    newItems.splice(index, 1);
                                    if (newItems.length === 0) {
                                      router.push('/sales/products');
                                    }
                                    sessionStorage.setItem('preOrderCart', JSON.stringify(newItems));
                                    return newItems;
                                  });
                                }
                              }}
                              className="w-10 text-center font-bold text-sm text-slate-900 bg-transparent border-none focus:outline-none appearance-none m-0 p-0"
                            />
                            {(() => {
                              return (
                                <span className="pr-1 text-sm font-bold text-slate-900">{item.unitNote || (item.product as any).purchaseUnit || (item.product as any).unit?.name || 'Karton'}</span>
                              );
                            })()}
                          </div>
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <label className="text-[11px] font-bold text-slate-600 pl-1 whitespace-nowrap">Harga Pengajuan</label>
                          {(() => {
                            const kartonP = Number(item.product.price);
                            const reqP = item.requestedPrice || kartonP;
                            if (reqP !== kartonP && kartonP > 0) {
                              const diffPercent = ((reqP - kartonP) / kartonP) * 100;
                              const formattedDiff = (diffPercent > 0 ? '+' : '') + diffPercent.toFixed(1).replace('.0', '') + '%';
                              return (
                                <span 
                                  title={`Selisih harga pengajuan (${formatCurrency(reqP)}) dibanding harga asli (${formatCurrency(kartonP)})`}
                                  className={cn(
                                    "text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-tight transition-all shrink-0",
                                    diffPercent < 0 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  )}
                                >
                                  {formattedDiff}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center gap-1.5 w-32 shrink-0">
                          <span className="text-xs font-bold text-slate-400">Rp</span>
                          <input 
                            type="text" 
                            required
                            value={item.requestedPrice ? item.requestedPrice.toLocaleString('id-ID') : ''}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              updateRequestedPrice(index, val ? parseInt(val, 10) : 0, undefined, false);
                            }}
                            onBlur={() => {
                              const minP = getMinPrice(item.product);
                              const effectiveUnitNote = item.unitNote || (item.product as any).purchaseUnit || (item.product as any).unit?.name || 'Karton';
                              const isEceran = effectiveUnitNote !== 'Karton' && effectiveUnitNote !== (item.product as any).purchaseUnit;
                              if (!isEceran && minP !== null) {
                                if (!item.requestedPrice || item.requestedPrice < minP) {
                                  updateRequestedPrice(index, minP, undefined, true);
                                  toast.warning(`Harga ${item.product.name} otomatis disesuaikan ke batas minimal ${formatCurrency(minP)}`, {
                                    description: 'Nominal nego berada di bawah batas harga terbawah.',
                                    duration: 4000
                                  });
                                }
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none font-bold text-sm text-right text-blue-700 p-0 m-0"
                          />
                        </div>
                      </div>

                      {(() => {
                        const minP = getMinPrice(item.product);
                        if (minP === null) return null;
                        const isLocked = item.requestedPrice === minP;
                        const isBelowMin = item.requestedPrice !== undefined && item.requestedPrice > 0 && item.requestedPrice < minP;
                        return (
                          <div className="mt-1 ml-2 flex items-center justify-between px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px]">
                            <div className="flex items-center gap-1.5 text-amber-800 font-medium">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Harga Terbawah: <strong className="font-bold">{formatCurrency(minP)}</strong></span>
                            </div>
                            {isLocked && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded shrink-0">
                                Terkunci Min
                              </span>
                            )}
                            {isBelowMin && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded shrink-0">
                                Ketik Selesai...
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {(() => {
                        const lastPurchased = lastPurchasedPrices[item.product.id];
                        if (!lastPurchased) return null;
                        
                        const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(lastPurchased.date));
                        const isSamePrice = item.requestedPrice === lastPurchased.price;
                        
                        return (
                          <div className="mt-1 ml-2 flex items-center justify-between px-2.5 py-1.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px]">
                            <div className="flex items-center gap-1.5 text-blue-900 font-medium truncate pr-1">
                              <History className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">
                                Toko ini terakhir beli @ <strong className="font-bold">{formatCurrency(lastPurchased.price)}</strong>
                                <span className="text-[10px] text-blue-600 ml-1">({formattedDate})</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateRequestedPrice(index, lastPurchased.price, lastPurchased.unitNote, false)}
                              className={cn(
                                "text-[10px] font-extrabold px-2 py-0.5 rounded border transition-all shrink-0 active:scale-95 shadow-2xs",
                                isSamePrice 
                                  ? "bg-blue-600 text-white border-blue-600 cursor-default" 
                                  : "bg-white text-blue-700 border-blue-200 hover:bg-blue-100"
                              )}
                            >
                              {isSamePrice ? 'Dipakai' : 'Gunakan'}
                            </button>
                          </div>
                        );
                      })()}
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
                    <label className="text-xs font-bold text-slate-500" htmlFor="deliveryDate">Tanggal Pengiriman Barang</label>
                    <input 
                      id="deliveryDate"
                      type="date" 
                      required
                      value={formData.deliveryDate}
                      onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                      className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500" htmlFor="paymentMethod">Metode Pembayaran</label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                      className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                    >
                      <option value="CASH">CASH</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="COD">COD</option>
                      <option value="TEMPO">TEMPO</option>
                    </select>
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
              <div className="mt-4 mb-12 w-full">
                <div className={cn(
                  "rounded-2xl shadow-lg p-4 flex flex-col gap-3 text-white border transition-all duration-300",
                  isPriceProposal ? "bg-linear-to-r from-amber-600 to-amber-500 border-amber-700 shadow-amber-500/20" : "bg-linear-to-r from-slate-900 to-slate-800 border-slate-700 shadow-slate-900/20"
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
