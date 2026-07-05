'use client';

import { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  details?: { label: string; value: ReactNode }[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmClassName?: string;
}

export default function ConfirmModal({
  open,
  title,
  message,
  details,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  confirmClassName = 'bg-rust text-white hover:bg-rust/90',
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end justify-center z-50 p-4">
      <div className="w-full max-w-md bg-bone rounded-2xl p-6 flex flex-col gap-5 shadow-xl">
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-lg font-heading font-bold text-ink">{title}</h2>
          {message && <p className="text-sm text-ink/60">{message}</p>}
        </div>
        {details && details.length > 0 && (
          <div className="bg-ink/5 rounded-xl px-4 py-4 flex flex-col gap-2 text-sm">
            {details.map((d, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-ink/50">{d.label}</span>
                <span className="font-semibold text-ink">{d.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 rounded-xl border-2 border-ink/15 text-ink/60 font-semibold text-sm hover:bg-ink/5 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`py-3 rounded-xl font-semibold text-sm transition ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
