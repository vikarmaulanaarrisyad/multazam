import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeveloperForm from './_components/DeveloperForm';
import { LogoutButton } from '@/app/sales/(dashboard)/_components/logout-button';

export default async function DeveloperPage() {
  const session = await auth();
  if (!session || session.user.role !== 'DEVELOPER') {
    redirect('/login');
  }

  let setting = await prisma.setting.findFirst();
  if (!setting) {
    setting = await prisma.setting.create({
      data: {}
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Developer Dashboard</h1>
          <p className="text-sm text-slate-500">Super admin controls & trial settings</p>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="grid gap-6">
          <DeveloperForm setting={setting} />
        </div>
      </main>
    </div>
  );
}
