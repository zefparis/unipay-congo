import { cookies } from 'next/headers';
import DashboardShell from '@/components/dashboard/DashboardShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const adminSecret = process.env.ADMIN_SECRET ?? '';
  const adminSession = cookies().get('admin_session')?.value ?? '';
  const isAdmin = adminSecret !== '' && adminSession === adminSecret;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070c18]">
      <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>
    </div>
  );
}
