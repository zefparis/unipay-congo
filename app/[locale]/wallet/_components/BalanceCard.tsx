'use client';

interface BalanceCardProps {
  currency: 'CDF' | 'USD' | 'USDT' | 'CGLT';
  amount: number | null;
  badge: 'instant' | 'blockchain' | 'mixed';
  onClick: () => void;
}

const CURRENCY_META: Record<BalanceCardProps['currency'], { label: string; icon: string; accent: string }> = {
  CDF:  { label: 'CDF',  icon: '💵', accent: 'text-signal' },
  USD:  { label: 'USD',  icon: '💲', accent: 'text-signal' },
  USDT: { label: 'USDT', icon: '₮',  accent: 'text-rust' },
  CGLT: { label: 'CGLT', icon: '🔷', accent: 'text-rust' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);
}

export default function BalanceCard({ currency, amount, badge, onClick }: BalanceCardProps) {
  const meta = CURRENCY_META[currency];

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-bone p-4 text-left active:scale-95 transition-transform shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{meta.icon}</span>
          <span className="font-heading font-bold text-sm text-ink">{meta.label}</span>
        </div>
        {badge === 'instant' && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-signal/15 text-signal">
            ⚡ Instantané
          </span>
        )}
        {badge === 'blockchain' && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rust/15 text-rust">
            🔗 Blockchain
          </span>
        )}
        {badge === 'mixed' && (
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-signal/15 text-signal">
              ⚡ Instantané
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rust/15 text-rust">
              🔗 Blockchain
            </span>
          </div>
        )}
      </div>
      <div>
        {amount === null ? (
          <span className="text-lg text-ink/30">—</span>
        ) : (
          <span className={`text-xl font-heading font-bold ${meta.accent}`}>
            {fmt(amount)}
          </span>
        )}
        <span className="text-sm font-body text-ink/40 ml-1">{meta.label}</span>
      </div>
    </button>
  );
}
