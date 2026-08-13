import { getAuditLogs } from '@/actions/audit-actions';
import AuditLogsClient from './_components/AuditLogsClient';

export const metadata = {
  title: 'Audit Trail | DIA MAKMUR ABADI',
  description: 'Log Aktivitas Sistem',
};

export default async function AuditLogsPage(props: {
  searchParams: Promise<{ page?: string; search?: string; startDate?: string; endDate?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const search = searchParams?.search || '';
  const startDate = searchParams?.startDate || '';
  const endDate = searchParams?.endDate || '';
  
  const result = await getAuditLogs(page, 50, search, startDate, endDate);

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
