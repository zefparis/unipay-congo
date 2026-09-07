import { Link } from '@/i18n/navigation';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * UniPay Congo brand logo — shield + seal SVG with serif wordmark.
 * Used in navbar, footer, dashboard sidebar, and dashboard top bar.
 */
export default function BrandLogo({
  size = 36,
  showText = true,
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 flex-shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M8 6 L56 6 L56 34 Q56 52 32 58 Q8 52 8 34 Z" fill="none" stroke="#D9B36C" strokeWidth="2.5"/>
        <path d="M22 16 L22 38 Q22 48 32 51 Q42 48 42 38 L42 16" fill="none" stroke="#0F6E56" strokeWidth="5" strokeLinecap="round"/>
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-serif font-bold text-lg text-text-primary tracking-tight ${textClassName}`}>
            UniPay
          </span>
          <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
            Congo
          </span>
        </div>
      )}
    </Link>
  );
}
