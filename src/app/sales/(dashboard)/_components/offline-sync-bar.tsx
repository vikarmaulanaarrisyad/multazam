'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, CloudUpload } from 'lucide-react';
import { createPreOrder } from '@/actions/sales-orders';
import { getOfflineOrders, syncAllOfflineOrders, OFFLINE_EVENT_NAME, OfflineOrder } from '@/lib/offline-sync';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function OfflineSyncBar() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingOrders, setPendingOrders] = useState<OfflineOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const refreshPendingCount = useCallback(() => {
    setPendingOrders(getOfflineOrders());
  }, []);

  const handleSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) {
      if (!navigator.onLine) {
        toast.error('Tidak ada koneksi internet untuk mengunduh/sinkronisasi.');
      }
      return;
    }

    const currentQueue = getOfflineOrders();
    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    setSyncStatus(`Mengirim ${currentQueue.length} pesanan...`);

    try {
      const res = await syncAllOfflineOrders(createPreOrder);
      if (res.synced > 0) {
        toast.success(`Berhasil mengirim ${res.synced} pesanan offline!`);
        router.refresh();
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} pesanan gagal dikirim: ${res.errors.join(', ')}`);
      }
      refreshPendingCount();
    } catch (e: any) {
      toast.error(e.message || 'Gagal melakukan sinkronisasi pesanan offline.');
    } finally {
      setIsSyncing(false);
      setSyncStatus(null);
    }
  }, [isSyncing, refreshPendingCount, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Koneksi internet kembali! Memulai sinkronisasi otomatis...');
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Anda dalam Mode Offline. Pesanan baru akan disimpan lokal di HP.');
    };

    const handleCustomUpdate = () => {
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(OFFLINE_EVENT_NAME, handleCustomUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(OFFLINE_EVENT_NAME, handleCustomUpdate);
    };
  }, [handleSync, refreshPendingCount]);

  if (isOnline && pendingOrders.length === 0) {
    return null;
  }

  return (
    <div className="w-full z-50 sticky top-0 animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>Mode Offline — Pesanan baru akan disimpan di HP</span>
          </div>
          {pendingOrders.length > 0 && (
            <span className="bg-amber-800 text-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {pendingOrders.length} Pending
            </span>
          )}
        </div>
      ) : pendingOrders.length > 0 ? (
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-md border-b border-blue-700">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-blue-200 shrink-0" />
            <span>{syncStatus || `${pendingOrders.length} Pesanan Offline Belum Terkirim`}</span>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs active:scale-95 disabled:opacity-75"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Proses...' : 'Sync Sekarang'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
