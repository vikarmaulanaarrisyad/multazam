'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notification.action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// Safely initialize only if URL is present to prevent hard crashes
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function NotificationBell({ role = "ADMIN" }: { role?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch initial unread notifications
    const fetchInitialNotifications = async () => {
      if (!supabase) return;
      
      const { data } = await supabase
        .from("Notification")
        .select("*")
        .eq("status", "UNREAD")
        .eq("role", role)
        .order("createdAt", { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length); // Ideally, fetch the true count separately
      }
    };

    fetchInitialNotifications();

    // 2. Subscribe to realtime changes on Notification table
    if (!supabase) return;

    const channel = supabase
      .channel(`${role.toLowerCase()}-notifications`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `role=eq.${role}`,
        },
        (payload) => {
          console.log("Supabase Realtime Event Received:", payload);
          // Update state with new notification
          setNotifications((prev) => [payload.new, ...prev].slice(0, 10)); // keep last 10
          setUnreadCount((count) => count + 1);
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((count) => Math.max(0, count - 1));
    // Database update
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await markAllNotificationsAsRead(role);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100" />}>
        <Bell className="h-5 w-5 text-slate-600" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100">
          <span className="text-sm font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Tidak ada notifikasi baru.
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem 
                key={notif.id} 
                className="flex flex-col items-start p-3 cursor-pointer border-b border-slate-50 last:border-0"
                onClick={() => handleMarkAsRead(notif.id)}
              >
                <div className="flex justify-between w-full items-start">
                  <span className="font-semibold text-sm pr-2">{notif.title}</span>
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                </div>
                <span className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</span>
                <span className="text-[10px] text-slate-400 mt-2">
                  {new Date(notif.createdAt).toLocaleString('id-ID')}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
