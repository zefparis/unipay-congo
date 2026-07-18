'use client';

import DevExpensesNav from '@/components/admin/dev-expenses/DevExpensesNav';

export default function DevExpensesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <DevExpensesNav />
      {children}
    </div>
  );
}
