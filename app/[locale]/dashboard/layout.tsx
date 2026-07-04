import { cookies } from 'next/headers';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { verifySessionToken } from '@/lib/admin-session';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const adminSession = cookies().get('admin_session')?.value ?? '';
  const isAdmin = await verifySessionToken(adminSession);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink">
      <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>
    </div>
  );
}
