import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import ConvergenceLattice from './ConvergenceLattice';
import ConvergenceDiagram from './ConvergenceDiagram';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section
      className="relative h-[100svh] md:h-screen flex items-center pt-16 overflow-hidden bg-ink"
    >
      {/* Convergence Lattice — atmospheric background */}
      <div className="absolute inset-0 text-bone pointer-events-none">
        <ConvergenceLattice variant="hero" opacity={0.07} className="w-full h-full" />
      </div>

      {/* Subtle radial glow from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(28,158,122,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            {/* Badge with ConvergenceDiagram */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-bone/10 border border-bone/30 text-bone/90 text-sm font-medium mb-8">
              <ConvergenceDiagram size={20} className="text-signal" />
              <span>{t('badge')}</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-bone leading-[1.1] tracking-tight mb-6">
              {t('title')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-bone/70 leading-relaxed mb-10 max-w-lg">
              {t('subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-rust text-bone font-semibold text-base hover:bg-rust/85 transition-all duration-200 shadow-lg shadow-rust/20"
              >
                {t('cta_primary')}
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#api"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-bone/30 text-bone font-semibold text-base hover:border-bone/60 hover:bg-bone/5 transition-all duration-200"
              >
                <BookOpen size={18} />
                {t('cta_secondary')}
              </a>
            </div>
          </div>

          {/* Right: API mockup card + ConvergenceDiagram */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Convergence diagram behind card */}
              <div className="absolute -top-8 -right-8 text-signal/30 pointer-events-none">
                <ConvergenceDiagram size={140} />
              </div>

              <div className="relative rounded-2xl border border-bone/15 bg-ink/80 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
                {/* Card header bar */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-bone/10 bg-bone/5">
                  <div className="w-3 h-3 rounded-full bg-danger/70" />
                  <div className="w-3 h-3 rounded-full bg-rust/70" />
                  <div className="w-3 h-3 rounded-full bg-signal/70" />
                  <span className="ml-3 text-xs text-bone/40 font-mono">POST /v1/payments/initiate</span>
                </div>
                {/* Code content */}
                <div className="p-5 font-mono text-sm leading-relaxed">
                  <pre className="text-bone/80 whitespace-pre-wrap">
                    <span className="text-rust">{'{'}</span>
                    {'\n'}
                    {'  '}<span className="text-signal">&quot;amount&quot;</span>
                    <span className="text-bone/50">: </span>
                    <span className="text-bone">5000</span>,{'\n'}
                    {'  '}<span className="text-signal">&quot;currency&quot;</span>
                    <span className="text-bone/50">: </span>
                    <span className="text-rust">&quot;CDF&quot;</span>,{'\n'}
                    {'  '}<span className="text-signal">&quot;channel&quot;</span>
                    <span className="text-bone/50">: </span>
                    <span className="text-rust">&quot;vodacash&quot;</span>,{'\n'}
                    {'  '}<span className="text-signal">&quot;phone&quot;</span>
                    <span className="text-bone/50">: </span>
                    <span className="text-rust">&quot;+243810000000&quot;</span>{'\n'}
                    <span className="text-rust">{'}'}</span>
                  </pre>
                  <div className="mt-4 pt-4 border-t border-bone/10">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-signal/15 text-signal text-xs font-semibold">
                        200 OK
                      </span>
                      <span className="text-xs text-bone/40 font-mono">transaction_id: UP-83921</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badge — convergence diagram replaces text badge */}
              <div className="absolute -bottom-4 -left-4 bg-ink border border-bone/15 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5">
                <ConvergenceDiagram size={16} className="text-signal" />
                <span className="text-xs font-semibold text-bone/80">4 réseaux connectés</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
