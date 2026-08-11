import { getAuditLogs } from '@/actions/audit-actions';
import AuditLogsClient from './_components/AuditLogsClient';

export const metadata = {
  title: 'Audit Trail | DIA MAKMUR ABADI',
  description: 'Log Aktivitas Sistem',
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const result = await getAuditLogs(page, 50);

  if (!result.success || !result.data) {
    return (
      <div className="p-6 text-center text-red-500 font-bold bg-red-50 rounded-2xl">
        {result.error || 'Gagal memuat log aktivitas.'}
      </div>
    );
  }

  return (
    <AuditLogsClient 
      initialData={result.data} 
      pagination={result.pagination} 
    />
  );
}
