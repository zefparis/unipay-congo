import clsx from 'clsx';
import { getExpenseNextAction } from '@/lib/dev-expenses/next-action';
import type { DevExpenseV4 } from '@/lib/dev-expenses/types';

interface Props {
  expense: DevExpenseV4;
  compact?: boolean;
}

export default function ExpenseNextAction({ expense, compact = false }: Props) {
  const action = getExpenseNextAction(expense);
  if (!action) return null;

  const variantCls: Record<string, string> = {
    primary: 'text-purple-600 dark:text-purple-400',
    secondary: 'text-gray-500 dark:text-gray-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <span
      className={clsx(
        'text-xs font-medium',
        compact && 'truncate',
        variantCls[action.variant] ?? variantCls.secondary,
      )}
    >
      {action.label}
    </span>
  );
}
