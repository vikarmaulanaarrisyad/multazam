import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { UsersClient } from '@/components/super-admin/UsersClient';

export const metadata = {
  title: 'Manajemen Pengguna | Multazam',
  description: 'Kelola akses akun Karyawan dan Sales',
};

export default async function UsersPage() {
  const session = await auth();
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <UsersClient users={users} />
    </div>
  );
}
