'use client';

import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <DashboardTopBar onMenuClick={() => setSidebarOpen(true)} />
      <DashboardSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="md:ml-64 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-8 md:pt-8">
          {children}
        </div>
      </main>
    </>
  );
}
