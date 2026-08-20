import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  role: 'ADMIN' | 'SUPER_ADMIN';
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
  logoUrl?: string | null;
  companyName?: string | null;
}

export function AdminLayout({ children, role, userName, userEmail, userImage, logoUrl, companyName }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-50/70 via-white to-purple-50/70">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <AdminSidebar role={role} logoUrl={logoUrl} companyName={companyName} />
      </div>

      <div className="lg:pl-64">
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
