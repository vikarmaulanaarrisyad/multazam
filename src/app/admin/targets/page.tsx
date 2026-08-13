import { getSalesTargets, getSalesUsers } from "@/actions/target-actions";
import { TargetsClient } from "./TargetsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Target Penjualan - Admin Panel",
};

export default async function TargetsPage() {
  const targets = await getSalesTargets();
  const salesUsers = await getSalesUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Target Penjualan</h1>
        <p className="text-slate-500">
          Atur target penjualan per hari atau per bulan untuk masing-masing Sales.
        </p>
      </div>

      <TargetsClient initialTargets={targets} salesUsers={salesUsers} />
    </div>
  );
}
