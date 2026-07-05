interface BlockchainWarningProps {
  network: string;
  estimatedDelay: string;
  irreversible?: boolean;
}

export default function BlockchainWarning({
  network,
  estimatedDelay,
  irreversible = true,
}: BlockchainWarningProps) {
  return (
    <div className="rounded-xl border border-rust/30 bg-rust/8 px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-rust font-heading font-bold text-sm">
          🔗 Opération blockchain
        </span>
      </div>
      <div className="text-xs text-ink/70 flex flex-col gap-0.5">
        <span>
          Réseau : <strong className="text-ink">{network}</strong>
        </span>
        {irreversible && (
          <span>
            ⚠ Irréversible une fois confirmée
          </span>
        )}
        <span>
          Délai estimé : <strong className="text-ink">{estimatedDelay}</strong>
        </span>
      </div>
    </div>
  );
}
