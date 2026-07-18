import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  message?: string;
}

export default function EmptyState({ icon: Icon, title, message }: Props) {
  return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">{title}</p>
      {message && <p className="text-xs mt-1">{message}</p>}
    </div>
  );
}
