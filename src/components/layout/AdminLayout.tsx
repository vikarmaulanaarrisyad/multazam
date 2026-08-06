import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  role: 'ADMIN' | 'SUPER_ADMIN';
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
}

export function AdminLayout({ children, role, userName, userEmail, userImage }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <AdminSidebar role={role} />
      </div>

      <div className="lg:pl-72">
        <AdminHeader 

          role={role} 
          userName={userName} 
          userEmail={userEmail} 
          userImage={userImage} 
        />

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
