import { LucideIcon } from 'lucide-react';

interface ActionMenuItemProps {
  icon: LucideIcon;
  label: string;
  subtext?: string;
  onClick: () => void;
  isBlockchain?: boolean;
}

export default function ActionMenuItem({
  icon: Icon,
  label,
  subtext,
  onClick,
  isBlockchain = false,
}: ActionMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink/5 transition active:bg-ink/10 text-left"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isBlockchain ? 'bg-rust/12' : 'bg-signal/12'
        }`}
      >
        <Icon size={20} className={isBlockchain ? 'text-rust' : 'text-signal'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading font-semibold text-ink">{label}</p>
        {subtext && <p className="text-xs text-ink/50">{subtext}</p>}
      </div>
      {isBlockchain && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rust/15 text-rust shrink-0">
          🔗
        </span>
      )}
    </button>
  );
}
