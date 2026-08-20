import { ReactNode } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { SettingService } from '@/services/setting.service';

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Ensure role is valid
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const setting = await SettingService.getSettings();

  return (
    <AdminLayout 
      role="SUPER_ADMIN" 
      userName={session.user.name || undefined}
      userEmail={session.user.email || undefined}
      userImage={session.user.image}
      logoUrl={setting?.logoUrl}
      companyName={setting?.companyName}
    >
      {children}
    </AdminLayout>
  );
}
