'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface BalanceCardProps {
  currency: 'CDF' | 'USD' | 'USDT' | 'CGLT';
  amount: number | null;
  badge: 'instant' | 'blockchain' | 'mixed';
  onClick: () => void;
}

const CURRENCY_META: Record<BalanceCardProps['currency'], { label: string; icon: string; accent: string }> = {
  CDF:  { label: 'CDF',  icon: '💵', accent: 'text-signal-deep' },
  USD:  { label: 'USD',  icon: '💲', accent: 'text-signal-deep' },
  USDT: { label: 'USDT', icon: '₮',  accent: 'text-rust-deep' },
  CGLT: { label: 'CGLT', icon: '🔷', accent: 'text-rust-deep' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);
}

export default function BalanceCard({ currency, amount, badge, onClick }: BalanceCardProps) {
  const meta = CURRENCY_META[currency];
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem('unipay_balance_hint_seen');
    if (!seen) setShowHint(true);
  }, []);

  function handleClick() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unipay_balance_hint_seen', '1');
    }
    setShowHint(false);
    onClick();
  }

  return (
    <button
      onClick={handleClick}
      className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white p-4 text-left active:scale-[0.97] active:brightness-95 transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{meta.icon}</span>
          <span className="font-heading font-bold text-sm text-ink">{meta.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {badge === 'instant' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-signal/20 text-signal-deep">
              ⚡ Instantané
            </span>
          )}
          {badge === 'blockchain' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rust/20 text-rust-deep">
              🔗 Réseau externe
            </span>
          )}
          {badge === 'mixed' && (
            <div className="flex flex-col gap-0.5 items-end">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-signal/20 text-signal-deep">
                ⚡ Instantané
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rust/20 text-rust-deep">
                🔗 Réseau externe
              </span>
            </div>
          )}
          <ChevronRight size={16} className="text-ink/30 shrink-0" />
        </div>
      </div>
      <div>
        {amount === null ? (
          <span className="text-lg text-ink-muted">—</span>
        ) : (
          <span className={`text-xl font-heading font-bold ${meta.accent}`}>
            {fmt(amount)}
          </span>
        )}
        <span className="text-sm font-body text-ink-muted ml-1">{meta.label}</span>
      </div>
      {showHint && (
        <p className="text-[11px] text-ink-muted font-body -mt-1">Toucher pour voir les actions</p>
      )}
    </button>
  );
}
