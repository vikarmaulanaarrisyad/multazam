import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { Store, UserCircle, MapPin, Phone, CalendarDays } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Toko - Admin Dashboard',
};

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Data Toko</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Informasi Toko</th>
                <th className="px-6 py-4">Kontak & Alamat</th>
                <th className="px-6 py-4">Didaftarkan Oleh</th>
                <th className="px-6 py-4">Tanggal Daftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data toko yang didaftarkan.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-1">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">{store.name}</p>
                          <p className="text-slate-500 flex items-center gap-1 mt-1">
                            <UserCircle className="w-4 h-4" />
                            {store.ownerName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2 max-w-xs">
                        <p className="text-slate-700 flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{store.address}</span>
                        </p>
                        {store.phone && (
                          <p className="text-slate-600 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            {store.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
                          {store.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{store.user?.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500">{store.user?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                        {new Date(store.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
