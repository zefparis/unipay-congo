'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ActionMenuProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function ActionMenu({ open, onClose, title, children }: ActionMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40" />
      <div
        className="relative w-full max-w-md bg-bone rounded-t-2xl shadow-xl flex flex-col max-h-[80vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-ink/10">
          <h3 className="font-heading font-bold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-ink/5 transition"
            aria-label="Fermer"
          >
            <X size={18} className="text-ink-muted" />
          </button>
        </div>
        <div className="flex flex-col divide-y divide-ink/5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
