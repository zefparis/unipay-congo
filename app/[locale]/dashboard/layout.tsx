import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { verifySessionToken } from '@/lib/admin-session';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const adminSession = cookies().get('admin_session')?.value ?? '';
  const isAdmin = await verifySessionToken(adminSession);

  return (
    <div className="min-h-screen bg-[#E8EBF0] dark:bg-navy">
      <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>
    </div>
  );
}
