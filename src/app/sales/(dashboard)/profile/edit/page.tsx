import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ChevronLeft, Save, User, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EditProfileForm } from './_components/EditProfileForm';

export const metadata = {
  title: 'Edit Profile - DIA MAKMUR ABADI',
};

export default async function EditProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Ambil data user terbaru dari database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 font-sans pb-20">
      {/* HEADER */}
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <Link href="/sales/profile" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </Link>
        <h1 className="text-lg font-bold text-slate-800 ml-2">Edit Profile</h1>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
          
          <EditProfileForm 
            initialName={user.name || ''} 
            initialEmail={user.email || ''} 
          />
        </div>
      </div>
    </div>
  );
}
