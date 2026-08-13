'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <div className="hidden lg:block w-32 h-6 animate-pulse bg-slate-100 rounded-md"></div>;
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[time.getDay()];
  
  const timeString = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium">
      <Clock className="w-4 h-4 text-blue-600" />
      <span>{dayName}, {timeString.replace(/\./g, ':')}</span>
    </div>
  );
}
