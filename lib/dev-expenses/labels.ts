import type {
  DevExpenseStatusV4,
  SettlementType,
  SettlementStatus,
  InitialPaymentStatus,
} from './types';

export type VisualStatus =
  | 'draft'
  | 'to_validate'
  | 'validated'
  | 'payment_in_progress'
  | 'completed'
  | 'rejected'
  | 'disputed'
  | 'cancelled'
  | 'archived';

interface StatusConfig {
  label: string;
  cls: string;
  dot: string;
}

export const STATUS_MAP: Record<DevExpenseStatusV4, VisualStatus> = {
  draft: 'draft',
  submitted: 'to_validate',
  under_review: 'to_validate',
  approved: 'validated',
  partially_approved: 'validated',
  payment_scheduled: 'payment_in_progress',
  partially_paid: 'payment_in_progress',
  completed: 'completed',
  rejected: 'rejected',
  disputed: 'disputed',
  cancelled: 'cancelled',
  archived: 'archived',
};

export const VISUAL_STATUS_CONFIG: Record<VisualStatus, StatusConfig> = {
  draft: {
    label: 'Brouillon',
    cls: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
  to_validate: {
    label: 'À valider',
    cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  validated: {
    label: 'Validée',
    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  payment_in_progress: {
    label: 'Paiement en cours',
    cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Terminée',
    cls: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    dot: 'bg-green-500',
  },
  rejected: {
    label: 'Refusée',
    cls: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500',
  },
  disputed: {
    label: 'Litige',
    cls: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  cancelled: {
    label: 'Annulée',
    cls: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
  archived: {
    label: 'Archivée',
    cls: 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
    dot: 'bg-gray-300',
  },
};

export const TECHNICAL_STATUS_LABELS: Record<DevExpenseStatusV4, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  under_review: 'En cours de vérification',
  approved: 'Validée',
  partially_approved: 'Validée partiellement',
  rejected: 'Refusée',
  payment_scheduled: 'Paiement programmé',
  partially_paid: 'Partiellement payée',
  completed: 'Terminée',
  disputed: 'En litige',
  cancelled: 'Annulée',
  archived: 'Archivée',
};

export function getVisualStatus(status: DevExpenseStatusV4 | null): VisualStatus | null {
  if (!status) return null;
  return STATUS_MAP[status] ?? 'draft';
}

export function getStatusLabel(status: DevExpenseStatusV4 | null): string {
  if (!status) return 'À vérifier';
  const visual = getVisualStatus(status);
  return visual ? VISUAL_STATUS_CONFIG[visual].label : 'Inconnu';
}

export function getTechnicalStatusLabel(status: DevExpenseStatusV4): string {
  return TECHNICAL_STATUS_LABELS[status] ?? status;
}

export const SETTLEMENT_TYPE_LABELS: Record<SettlementType, string> = {
  supplier_payment: 'Paiement fournisseur',
  reimbursement: 'Remboursement',
  partial_reimbursement: 'Remboursement partiel',
  internal_offset: 'Compensation interne',
  adjustment: 'Ajustement',
  other: 'Autre',
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  scheduled: 'Programmé',
  processing: 'En traitement',
  completed: 'Confirmé',
  failed: 'Échec',
  cancelled: 'Annulé',
};

export const SETTLEMENT_STATUS_CONFIG: Record<SettlementStatus, StatusConfig> = {
  scheduled: {
    label: 'Programmé',
    cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  processing: {
    label: 'En traitement',
    cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Confirmé',
    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Échec',
    cls: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500',
  },
  cancelled: {
    label: 'Annulé',
    cls: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Virement bancaire',
  card: 'Carte bancaire',
  usdt: 'USDT',
  usdc: 'USDC',
  binance: 'Binance',
  wallet_unipay: 'Wallet UniPay',
  mobile_money: 'Mobile Money',
  direct_supplier: 'Paiement direct au fournisseur',
  internal_offset: 'Compensation interne',
  cash: 'Espèces',
  other: 'Autre',
};

export const INITIAL_PAYMENT_STATUS_LABELS: Record<InitialPaymentStatus, string> = {
  unpaid: 'Non payée',
  paid_by_incurred_entity: 'Payée par l\'entité ayant engagé',
  paid_by_covering_entity: 'Payée par l\'entité de prise en charge',
  paid_by_third_party: 'Payée par un tiers',
  unknown: 'Inconnu',
};

export const CREDITOR_TYPE_LABELS: Record<string, string> = {
  cloud_provider: 'Fournisseur cloud',
  freelance: 'Freelance',
  company: 'Société',
  individual: 'Particulier',
  other: 'Autre',
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  person: 'Personne',
  company: 'Société',
  partner_group: 'Groupe partenaire',
  project: 'Projet',
  other: 'Autre',
};

export const QUOTE_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: 'Brouillon',
    cls: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
  sent: {
    label: 'Envoyé',
    cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  accepted: {
    label: 'Accepté',
    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Refusé',
    cls: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500',
  },
  expired: {
    label: 'Expiré',
    cls: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
};

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'created_at', label: 'Plus récent' },
  { value: 'invoice_date', label: 'Plus ancien' },
  { value: 'due_date', label: 'Échéance proche' },
  { value: 'amount_usd', label: 'Montant croissant' },
  { value: 'invoice_amount', label: 'Montant décroissant' },
];

export const PAGE_SIZE_OPTIONS = [25, 50, 100];
