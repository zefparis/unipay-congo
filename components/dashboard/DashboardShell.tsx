'use client';

import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import SandboxBanner from './SandboxBanner';

export default function DashboardShell({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <DashboardTopBar onMenuClick={() => setSidebarOpen(true)} />
      <DashboardSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />
      <main className="md:ml-64 min-h-screen">
        <SandboxBanner />
        <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-8 md:pt-8">
          {children}
        </div>
      </main>
    </>
  );
}
