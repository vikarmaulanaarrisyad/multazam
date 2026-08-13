'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function AutoRefreshTimer({ intervalMinutes = 5 }: { intervalMinutes?: number }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(intervalMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      router.refresh();
      setTimeLeft(intervalMinutes * 60);
    }
  }, [timeLeft, router, intervalMinutes]);

  useEffect(() => {
    // Reset timer when component mounts
    setTimeLeft(intervalMinutes * 60);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [intervalMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold whitespace-nowrap" title={`Halaman akan direfresh secara otomatis setiap ${intervalMinutes} menit`}>
      <RefreshCw className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'animate-spin' : ''}`} />
      <span>Refresh: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
    </div>
  );
}
