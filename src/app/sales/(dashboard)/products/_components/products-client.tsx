'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ScanBarcode, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Product, Category, Unit } from '@/generated/prisma/client';
import { cn } from '@/lib/utils';

type ProductWithRelations = Omit<Product, 'price'> & {
  price: number;
  category: Category;
  unit: Unit | null;
};

interface SalesProductsClientProps {
  initialProducts: ProductWithRelations[];
  categories: Category[];
}

export function SalesProductsClient({ initialProducts, categories }: SalesProductsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = sessionStorage.getItem('preOrderCart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const initialCart: Record<string, number> = {};
          parsed.forEach((item: any) => {
            if (item.product && item.product.id) {
              initialCart[item.product.id] = item.quantity;
            }
          });
          setCart(initialCart);
        }
      } catch (e) {
        console.error('Failed to parse existing cart', e);
      }
    }
  }, []);

  const updateCart = (productId: string, change: number, maxStock: number) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = currentQty + change;
      
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      
      if (newQty > maxStock) return prev;
      
      return { ...prev, [productId]: newQty };
    });
  };

  const setCartQuantity = (productId: string, qty: number, maxStock: number) => {
    setCart(prev => {
      if (qty < 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: Math.min(qty, maxStock) };
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const product = initialProducts.find(p => p.id === id);
    return total + (product ? product.price * qty : 0);
  }, 0);

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleCheckout = () => {
    const stored = sessionStorage.getItem('preOrderCart');
    let existingItems: any[] = [];
    if (stored) {
      try { existingItems = JSON.parse(stored); } catch (e) {}
    }

    const cartItems = Object.entries(cart).map(([id, quantity]) => {
      const product = initialProducts.find(p => p.id === id);
      const existing = existingItems.find((item: any) => item.product && item.product.id === id);
      return { 
        product, 
        quantity,
        requestedPrice: existing ? existing.requestedPrice : undefined
      };
    }).filter(item => item.product !== undefined);
    
    sessionStorage.setItem('preOrderCart', JSON.stringify(cartItems));
    router.push('/sales/requests/new');
  };

  const filteredProducts = initialProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-4 pt-4 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-slate-100">
        <div className="px-4">
          <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 text-slate-500 transition-transform active:scale-[0.98]">
            <Search className="w-5 h-5 mr-2" />
            <input 
              className="bg-transparent border-none outline-none w-full text-sm text-slate-900" 
              placeholder="Cari SKU atau nama produk..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="text-blue-600 ml-2">
              <ScanBarcode className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Category Chips */}
        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-3 snap-x">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-sm snap-start transition-transform active:scale-95",
              selectedCategory === null 
                ? "bg-blue-600 text-white" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            Semua Produk
          </button>
          {categories.map(category => (
            <button 
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 snap-start transition-transform active:scale-95",
                selectedCategory === category.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-36 pt-4">
        {filteredProducts.map(product => {
          const isOutOfStock = product.stock <= 0;
          const isLowStock = product.stock > 0 && product.stock <= 10;
          const cartQty = cart[product.id] || 0;
          
          return (
            <div 
              key={product.id} 
              className={cn(
                "flex flex-col rounded-xl overflow-hidden relative group transition-transform border border-slate-100 bg-white shadow-sm",
                !isOutOfStock && "active:scale-[0.98]",
                isOutOfStock && "opacity-75 grayscale-[0.2]"
              )}
            >
              {isLowStock && (
                <div className="absolute top-2 right-2 bg-red-100 text-red-700 font-bold text-[10px] px-2 py-1 rounded-full z-10 border border-red-200">
                  Stok Menipis
                </div>
              )}
              
              <div className="p-3 flex flex-col flex-1">
                <span className="text-[11px] font-medium text-slate-400 mb-1">{product.code}</span>
                <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <span className="text-[11px] font-medium text-slate-400 mt-1">{product.category.name}</span>
                
                <div className="mt-auto pt-3 flex flex-col gap-2">
                  <div className={cn(
                    "flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md text-[11px] font-semibold",
                    isOutOfStock 
                      ? "bg-slate-100 text-slate-500" 
                      : isLowStock 
                        ? "bg-red-50 text-red-600" 
                        : "bg-green-50 text-green-600"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isOutOfStock ? "bg-slate-400" : isLowStock ? "bg-red-500" : "bg-green-500"
                    )}></div>
                    <span>Stok {product.stock}</span>
                  </div>
                  
                  <div className="flex flex-col mt-1">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(product.price)} <span className="text-[10px] font-normal text-slate-500">/Karton</span></span>
                    {(product as any).retailPriceNote && (
                      <span className="text-[10px] font-medium text-emerald-600 mt-0.5">Ecer: {(product as any).retailPriceNote}</span>
                    )}
                    {(product as any).contents && (
                      <span className="text-[10px] font-medium text-slate-500">Isi: {(product as any).contents}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end mt-1 h-8">
                    {cart[product.id] !== undefined ? (
                      <div className="flex items-center gap-1.5 bg-blue-50 rounded-full p-1 border border-blue-100 shadow-sm">
                        <button 
                          onClick={() => updateCart(product.id, -1, product.stock)}
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-white text-blue-600 shadow-sm active:scale-95 shrink-0"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={product.stock}
                          value={cartQty === 0 && !cart[product.id] ? '' : cartQty || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            if (!isNaN(val)) setCartQuantity(product.id, val, product.stock);
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (isNaN(val) || val <= 0) {
                              setCart(prev => {
                                const newCart = { ...prev };
                                delete newCart[product.id];
                                return newCart;
                              });
                            }
                          }}
                          className="text-[11px] font-bold text-blue-800 w-8 text-center bg-transparent border-none focus:outline-none appearance-none m-0 p-0"
                        />
                        <button 
                          onClick={() => updateCart(product.id, 1, product.stock)}
                          disabled={cartQty >= product.stock}
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shadow-sm active:scale-95",
                            cartQty >= product.stock ? "bg-slate-100 text-slate-400 opacity-50" : "bg-white text-blue-600"
                          )}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => updateCart(product.id, 1, product.stock)}
                        disabled={isOutOfStock}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shadow-sm active:scale-95",
                          isOutOfStock 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        )}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <p>Produk tidak ditemukan.</p>
        </div>
      )}

      {/* Floating Cart Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 pb-safe">
          <div className="bg-slate-900 rounded-2xl shadow-xl p-3 px-4 flex items-center justify-between text-white border border-slate-700">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-300 font-medium">{cartItemsCount} Produk di Keranjang</span>
              <span className="text-sm font-bold">{formatCurrency(cartTotal)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors shadow-sm active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
