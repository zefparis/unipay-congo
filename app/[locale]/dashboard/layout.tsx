import DashboardShell from '@/components/dashboard/DashboardShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070c18]">
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
