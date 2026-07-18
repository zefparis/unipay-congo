import clsx from 'clsx';
import { getVisualStatus, VISUAL_STATUS_CONFIG, getTechnicalStatusLabel } from '@/lib/dev-expenses/labels';
import type { DevExpenseStatusV4 } from '@/lib/dev-expenses/types';

interface Props {
  status: DevExpenseStatusV4 | null;
  showTechnical?: boolean;
  size?: 'sm' | 'md';
}

export default function ExpenseStatusBadge({ status, showTechnical = false, size = 'sm' }: Props) {
  const visual = getVisualStatus(status);

  if (!visual || !status) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        À vérifier
      </span>
    );
  }

  const cfg = VISUAL_STATUS_CONFIG[visual];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        cfg.cls,
      )}
      title={showTechnical ? getTechnicalStatusLabel(status) : undefined}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
