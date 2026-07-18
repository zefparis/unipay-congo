'use client';

import { formatDateTime } from '@/lib/dev-expenses/formatters';
import { getTechnicalStatusLabel } from '@/lib/dev-expenses/labels';
import type { AuditEvent } from '@/lib/dev-expenses/types';

interface Props {
  events: AuditEvent[];
  locale: string;
}

const EVENT_LABELS: Record<string, string> = {
  expense_created: 'Facture créée',
  expense_edited: 'Facture modifiée',
  status_transition: 'Changement de statut',
  settlement_created: 'Paiement enregistré',
  settlement_updated: 'Paiement mis à jour',
  migration_review_resolved: 'Données historiques vérifiées',
};

function formatMetadata(eventType: string, metadata: Record<string, unknown>): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const parts: string[] = [];
  if (metadata.approved_amount != null) parts.push(`Montant validé: ${metadata.approved_amount}`);
  if (metadata.reason) parts.push(`Motif: ${metadata.reason}`);
  if (metadata.notes) parts.push(`Notes: ${metadata.notes}`);
  if (metadata.settlement_type) parts.push(`Type: ${metadata.settlement_type}`);
  if (metadata.amount) parts.push(`Montant: ${metadata.amount}`);
  if (metadata.to) parts.push(`Vers: ${metadata.to}`);
  if (metadata.from) parts.push(`De: ${metadata.from}`);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function ExpenseTimeline({ events, locale }: Props) {
  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Historique</h3>
        <p className="text-sm text-gray-400 text-center py-6">Aucun événement enregistré</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Historique</h3>
      <div className="space-y-4">
        {events.map((event, i) => {
          const label = EVENT_LABELS[event.event_type] ?? event.event_type;
          const detail = formatMetadata(event.event_type, event.metadata);
          return (
            <div key={event.id} className="flex gap-3">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                {i < events.length - 1 && (
                  <div className="w-px h-full bg-gray-200 dark:bg-gray-700 flex-1 mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                  {event.previous_status && event.new_status && (
                    <span className="text-xs text-gray-500">
                      {getTechnicalStatusLabel(event.previous_status as never)} → {getTechnicalStatusLabel(event.new_status as never)}
                    </span>
                  )}
                </div>
                {detail && (
                  <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{formatDateTime(event.created_at, locale)}</span>
                  {event.actor_name && (
                    <span className="text-xs text-gray-400">· {event.actor_name}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
