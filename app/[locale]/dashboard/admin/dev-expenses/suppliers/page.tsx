'use client';

import { Building2 } from 'lucide-react';
import SupplierList from '@/components/admin/dev-expenses/SupplierList';

export default function SuppliersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-6 h-6 text-purple-600" />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Fournisseurs</h1>
      </div>

      <SupplierList />
    </div>
  );
}
