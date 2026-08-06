import { ReactNode } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Ensure role is valid
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
    <AdminLayout 
      role="ADMIN" 
      userName={session.user.name || undefined}
      userEmail={session.user.email || undefined}
      userImage={session.user.image}
    >
      {children}
    </AdminLayout>
  );
}
