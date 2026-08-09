'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ClipboardList, User, Tags, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/sales', icon: Home },
    // { name: 'Orders', href: '/sales/orders', icon: Package },
    { name: 'Visits', href: '/sales/visits', icon: Calendar },
    { name: 'Requests', href: '/sales/requests', icon: ClipboardList },
    { name: 'Products', href: '/sales/products', icon: Tags },
    { name: 'Profile', href: '/sales/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-18 pb-safe z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/sales' && pathname.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex flex-col items-center gap-1 p-2 w-16 group transition-colors",
              isActive ? "text-primary" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <div className={cn(
              "w-12 h-8 rounded-full flex items-center justify-center transition-colors",
              isActive ? "bg-primary/10" : "group-hover:bg-slate-100"
            )}>
              <Icon className={cn("w-5 h-5", isActive && "font-bold")} />
            </div>
            <span className={cn(
              "text-[10px]", 
              isActive ? "font-bold" : "font-medium"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
