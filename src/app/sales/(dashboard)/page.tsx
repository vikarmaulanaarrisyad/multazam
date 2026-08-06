import React from 'react';
import { CalendarCheck, TrendingUp, Clock, AlertCircle, MapPin, ShoppingCart, PackageSearch, MapPinIcon } from 'lucide-react';

export default function SalesDashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-24 h-full">
      {/* Target Progress Card */}
      <section className="bg-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Monthly Sales Target</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              Rp 125.5M <span className="text-sm font-normal text-slate-500">/ Rp 150M</span>
            </div>
          </div>
          <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-md shadow-sm">
            82%
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
            <div className="bg-primary h-full rounded-full relative" style={{ width: '82%' }}>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-primary">Achieved: Rp 125.5M</span>
            <span className="text-slate-500">Remaining: Rp 24.5M</span>
          </div>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 gap-4">
        {/* Visits KPI */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CalendarCheck className="text-emerald-700 w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <TrendingUp className="w-3 h-3 font-bold" />
              <span className="text-[11px] font-bold">80%</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">Visit Completion</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              12 <span className="text-sm font-normal text-slate-500">/ 15</span>
            </div>
          </div>
        </div>

        {/* Approvals KPI */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Clock className="text-red-600 w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <AlertCircle className="w-3 h-3 font-bold" />
              <span className="text-[11px] font-bold">4</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">Pending Approvals</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              4 <span className="text-sm font-normal text-slate-500">Tasks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar">
          <button className="snap-start flex-none w-28 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm group">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <MapPin className="text-primary w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-900 text-center leading-tight">Add<br/>Visit</span>
          </button>
          
          <button className="snap-start flex-none w-28 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm group">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <ShoppingCart className="text-emerald-700 w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-900 text-center leading-tight">New<br/>Order</span>
          </button>
          
          <button className="snap-start flex-none w-28 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm group">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <PackageSearch className="text-blue-700 w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-900 text-center leading-tight">Check<br/>Stock</span>
          </button>
        </div>
      </section>

      {/* Upcoming Visits */}
      <section className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming Visits</h2>
          <button className="text-primary text-xs font-medium px-2 py-1 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors">View All</button>
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Visit Item 1 */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-slate-200 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
              TJ
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">Toko Jaya Abadi</h3>
              <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                <MapPinIcon className="w-4 h-4" />
                <span className="text-xs truncate">Jl. Sudirman No. 45, Jakarta</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-xs font-bold text-slate-900">14:00</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-100">Scheduled</span>
            </div>
          </div>
          
          {/* Visit Item 2 */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-slate-200 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 font-bold text-sm">
              SM
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">Supermarket Jaya</h3>
              <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                <MapPinIcon className="w-4 h-4" />
                <span className="text-xs truncate">Jl. Gatot Subroto Kav 21</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-xs font-bold text-slate-900">16:30</span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-200">Pending</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
