'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, UserCircle, Search, ChevronDown, ArrowRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewOrderStoreClientProps {
  stores: {
    id: string;
    name: string;
    ownerName: string | null;
    phone: string | null;
    address: string | null;
  }[];
}

export function NewOrderStoreClient({ stores }: NewOrderStoreClientProps) {
  const router = useRouter();
  
  const [selectedStoreId, setSelectedStoreId] = useState<string>('NEW');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    ownerName: '',
    customerPhone: '',
    shippingAddress: ''
  });

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    if (storeId === 'NEW') {
      setFormData(prev => ({
        ...prev,
        customerName: '',
        ownerName: '',
        customerPhone: '',
        shippingAddress: ''
      }));
    } else {
      const store = stores.find(s => s.id === storeId);
      if (store) {
        setFormData(prev => ({
          ...prev,
          customerName: store.name,
          ownerName: store.ownerName || '',
          customerPhone: store.phone || '',
          shippingAddress: store.address || ''
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) return;

    // Load any existing preOrderFormData to preserve other fields, or create new
    let existingForm = {};
    try {
      const stored = sessionStorage.getItem('preOrderFormData');
      if (stored) {
        existingForm = JSON.parse(stored);
      }
    } catch(e) {}

    const newFormData = {
      ...existingForm,
      customerName: formData.customerName,
      ownerName: formData.ownerName,
      customerPhone: formData.customerPhone,
      shippingAddress: formData.shippingAddress,
      storeId: selectedStoreId
    };

    sessionStorage.setItem('preOrderFormData', JSON.stringify(newFormData));
    
    // Check if there are already items in the cart
    const cartStored = sessionStorage.getItem('preOrderCart');
    if (cartStored && cartStored !== '[]') {
      // If they already selected products previously, go straight to checkout? 
      // No, let them go back to products catalog to review or add more
      router.push('/sales/products');
    } else {
      router.push('/sales/products');
    }
  };

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => router.push('/sales')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Store className="text-blue-700 w-4 h-4" />
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">Langkah 1: Pilih Toko</span>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Mulai Pesanan Baru</h2>
          <p className="text-xs text-slate-600">
            Pilih pelanggan yang sudah ada atau input nama pelanggan baru sebelum memilih produk.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <UserCircle className="w-5 h-5" />
              Detail Pelanggan
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Select Store (Searchable) */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-500" htmlFor="storeSelect">Pilih Toko (Bisa Cari Nama Toko / Pemilik)</label>
                
                <button
                  type="button"
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="w-full h-12 px-3 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border font-medium flex items-center justify-between shadow-sm"
                >
                  <span className="truncate">
                    {selectedStoreId === 'NEW' 
                      ? '+ Input Manual / Toko Baru' 
                      : stores.find(s => s.id === selectedStoreId)?.name || 'Pilih Toko...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isStoreDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsStoreDropdownOpen(false)}
                    ></div>
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden max-h-60">
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder="Cari toko atau pemilik..."
                        value={storeSearchQuery}
                        onChange={(e) => setStoreSearchQuery(e.target.value)}
                        className="w-full text-sm outline-none bg-transparent"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleStoreChange('NEW');
                          setIsStoreDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-3 text-sm rounded-md mb-1 transition-colors",
                          selectedStoreId === 'NEW' ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        + Input Manual / Toko Baru
                      </button>
                      
                      {stores
                        .filter(s => 
                          s.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) || 
                          (s.ownerName && s.ownerName.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                        )
                        .map(store => (
                          <button
                            key={store.id}
                            type="button"
                            onClick={() => {
                              handleStoreChange(store.id);
                              setIsStoreDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm rounded-md mb-1 transition-colors flex flex-col",
                              selectedStoreId === store.id ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                            )}
                          >
                            <span>{store.name}</span>
                            {store.ownerName && (
                              <span className="text-xs text-slate-500 font-normal">Pemilik: {store.ownerName}</span>
                            )}
                          </button>
                        ))
                      }
                      
                      {stores.filter(s => 
                          s.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) || 
                          (s.ownerName && s.ownerName.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                        ).length === 0 && (
                        <div className="text-center py-3 text-xs text-slate-500">Toko tidak ditemukan.</div>
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-bold text-slate-500" htmlFor="customerName">Nama Pelanggan / Toko</label>
                <input 
                  id="customerName"
                  type="text" 
                  required
                  placeholder="Masukkan nama pelanggan"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500" htmlFor="ownerName">Nama Pemilik Toko (Opsional)</label>
                <input 
                  id="ownerName"
                  type="text" 
                  placeholder="Masukkan nama pemilik"
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500" htmlFor="contactNumber">Nomor Telepon (Opsional)</label>
                <input 
                  id="contactNumber"
                  type="tel" 
                  placeholder="e.g. +62 812..."
                  value={formData.customerPhone}
                  onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500" htmlFor="shippingAddress">Alamat Pengiriman (Opsional)</label>
                <textarea 
                  id="shippingAddress"
                  placeholder="Masukkan alamat pengiriman..."
                  value={formData.shippingAddress}
                  onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
                  className="w-full h-20 p-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all border"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={!formData.customerName.trim()}
              className="w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 bg-blue-600 text-white hover:bg-blue-500 text-sm"
            >
              Lanjut Pilih Produk
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
