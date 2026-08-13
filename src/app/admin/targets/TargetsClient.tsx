"use client";

import { useState } from "react";
import { setSalesTarget, deleteSalesTarget } from "@/actions/target-actions";
import { Plus, Edit2, Trash2, Calendar, Target } from "lucide-react";
import { toast } from "sonner";

// Utility function to format Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

type TargetPeriodType = "DAILY" | "WEEKLY" | "MONTHLY";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface SalesTarget {
  id: string;
  userId: string;
  user?: User;
  targetAmount: any;
  periodType: TargetPeriodType;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  createdAt: Date;
}

export function TargetsClient({
  initialTargets,
  salesUsers,
}: {
  initialTargets: any[];
  salesUsers: User[];
}) {
  const [targets, setTargets] = useState<SalesTarget[]>(initialTargets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [periodType, setPeriodType] = useState<TargetPeriodType>("MONTHLY");
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setUserId("");
    setTargetAmount("");
    setNotes("");
    setPeriodType("MONTHLY");
    setIsModalOpen(false);
  };

  const handleEdit = (target: SalesTarget) => {
    setEditingId(target.id);
    setUserId(target.userId);
    setTargetAmount(target.targetAmount.toString());
    setPeriodType(target.periodType);
    if (target.periodType === "MONTHLY") {
      const d = new Date(target.startDate);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    } else {
      setSelectedDate(new Date(target.startDate).toISOString().split("T")[0]);
    }
    setNotes(target.notes || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus target ini?")) return;
    try {
      const res = await deleteSalesTarget(id);
      if (res.success) {
        toast.success(res.message);
        setTargets(targets.filter((t) => t.id !== id));
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !targetAmount) {
      toast.error("Harap isi Sales dan Target");
      return;
    }

    setIsSubmitting(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (periodType === "MONTHLY") {
        const [year, month] = selectedMonth.split("-");
        startDate = new Date(Number(year), Number(month) - 1, 1);
        endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      } else if (periodType === "DAILY") {
        startDate = new Date(`${selectedDate}T00:00:00`);
        endDate = new Date(`${selectedDate}T23:59:59`);
      } else {
        // Fallback for weekly if implemented later
        startDate = new Date();
        endDate = new Date();
      }

      const res = await setSalesTarget({
        userId,
        targetAmount: Number(targetAmount),
        periodType,
        startDate,
        endDate,
        notes,
      });

      if (res.success) {
        toast.success(res.message);
        // We can just reload the page to get fresh data
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="text-base font-semibold text-slate-800">Daftar Target</h3>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Target</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Sales</th>
              <th className="px-6 py-3 font-medium">Periode</th>
              <th className="px-6 py-3 font-medium">Tanggal/Bulan</th>
              <th className="px-6 py-3 font-medium text-right">Target (Rp)</th>
              <th className="px-6 py-3 font-medium">Catatan</th>
              <th className="px-6 py-3 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Belum ada target yang diatur
                </td>
              </tr>
            ) : (
              targets.map((target) => (
                <tr key={target.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {target.user?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        target.periodType === "MONTHLY"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {target.periodType === "MONTHLY" ? "BULANAN" : "HARIAN"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {target.periodType === "MONTHLY"
                      ? new Date(target.startDate).toLocaleDateString("id-ID", {
                          month: "long",
                          year: "numeric",
                        })
                      : new Date(target.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">
                    {formatRupiah(Number(target.targetAmount))}
                  </td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-36">
                    {target.notes || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(target)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Target"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(target.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Target Penjualan" : "Buat Target Penjualan"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Pilih Sales</label>
                <select
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">-- Pilih Sales --</option>
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tipe Periode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="periodType"
                      value="MONTHLY"
                      checked={periodType === "MONTHLY"}
                      onChange={() => setPeriodType("MONTHLY")}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Bulanan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="periodType"
                      value="DAILY"
                      checked={periodType === "DAILY"}
                      onChange={() => setPeriodType("DAILY")}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Harian</span>
                  </label>
                </div>
              </div>

              {periodType === "MONTHLY" ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Pilih Bulan</label>
                  <input
                    type="month"
                    required
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Pilih Tanggal</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Target Penjualan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm">Rp</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Contoh: 10000000"
                  />
                </div>
                {targetAmount && (
                  <p className="text-xs text-primary font-medium mt-1">
                    Format: {formatRupiah(Number(targetAmount))}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Catatan (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none min-h-20 resize-none"
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Target</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
