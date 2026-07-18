import type { DevExpenseV4, DevExpenseStatusV4 } from './types';

export interface NextAction {
  label: string;
  variant: 'primary' | 'secondary' | 'warning' | 'danger' | 'info';
  targetStatus?: DevExpenseStatusV4;
}

export function getExpenseNextAction(expense: DevExpenseV4): NextAction | null {
  if (expense.migration_review_required) {
    return {
      label: 'Vérifier les données',
      variant: 'warning',
    };
  }

  const status = expense.status_v4;
  if (!status) {
    return {
      label: 'Vérifier les données',
      variant: 'warning',
    };
  }

  switch (status) {
    case 'draft':
      return { label: 'Compléter et soumettre', variant: 'primary', targetStatus: 'submitted' };

    case 'submitted':
      return { label: 'Commencer la vérification', variant: 'info', targetStatus: 'under_review' };

    case 'under_review':
      return { label: 'Valider ou refuser', variant: 'primary' };

    case 'approved':
    case 'partially_approved':
      return { label: 'Programmer le paiement', variant: 'primary', targetStatus: 'payment_scheduled' };

    case 'payment_scheduled':
      return { label: 'Confirmer le règlement', variant: 'primary' };

    case 'partially_paid':
      return { label: 'Ajouter le solde', variant: 'primary' };

    case 'completed':
      return { label: 'Archiver', variant: 'secondary', targetStatus: 'archived' };

    case 'rejected':
      return { label: 'Repasser en brouillon', variant: 'secondary', targetStatus: 'draft' };

    case 'disputed':
      return { label: 'Reprendre la vérification', variant: 'info', targetStatus: 'under_review' };

    case 'cancelled':
      return { label: 'Repasser en brouillon', variant: 'secondary', targetStatus: 'draft' };

    case 'archived':
      return null;

    default:
      return null;
  }
}
