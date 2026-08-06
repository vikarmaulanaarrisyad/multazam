import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="ADMIN">{children}</DashboardLayout>;
}
