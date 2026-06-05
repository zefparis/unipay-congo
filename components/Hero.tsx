import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-[100svh] flex items-center pt-16 overflow-hidden">
      {/* Background image */}
      <Image
        src="/hero.png"
        alt=""
        fill
        className="object-cover object-center"
        priority
        quality={85}
      />

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Subtle grid texture on top of overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/25 text-[#1D9E75] text-sm font-medium mb-8">
              <ShieldCheck size={15} />
              <span>{t('badge')}</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white leading-[1.1] tracking-tight mb-6" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {t('title')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-200 leading-relaxed mb-10 max-w-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {t('subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-base hover:bg-[#178a65] transition-all duration-200 shadow-lg shadow-[#1D9E75]/25 hover:shadow-[#1D9E75]/40 hover:-translate-y-0.5"
              >
                {t('cta_primary')}
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#api"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:border-white hover:bg-white/10 transition-all duration-200"
              >
                <BookOpen size={18} />
                {t('cta_secondary')}
              </a>
            </div>
          </div>

          {/* Right: API mockup card */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1420] shadow-2xl shadow-gray-200/60 dark:shadow-black/40 overflow-hidden">
                {/* Card header bar */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#0a1222]">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-400 font-mono">POST /v1/payments/initiate</span>
                </div>
                {/* Code content */}
                <div className="p-5 font-mono text-sm leading-relaxed">
                  <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    <span className="text-purple-600 dark:text-purple-400">{'{'}</span>
                    {'\n'}
                    {'  '}<span className="text-blue-600 dark:text-blue-400">&quot;amount&quot;</span>
                    <span className="text-gray-600 dark:text-gray-400">: </span>
                    <span className="text-emerald-600 dark:text-emerald-400">5000</span>,{'\n'}
                    {'  '}<span className="text-blue-600 dark:text-blue-400">&quot;currency&quot;</span>
                    <span className="text-gray-600 dark:text-gray-400">: </span>
                    <span className="text-amber-600 dark:text-amber-400">&quot;CDF&quot;</span>,{'\n'}
                    {'  '}<span className="text-blue-600 dark:text-blue-400">&quot;channel&quot;</span>
                    <span className="text-gray-600 dark:text-gray-400">: </span>
                    <span className="text-amber-600 dark:text-amber-400">&quot;vodacash&quot;</span>,{'\n'}
                    {'  '}<span className="text-blue-600 dark:text-blue-400">&quot;phone&quot;</span>
                    <span className="text-gray-600 dark:text-gray-400">: </span>
                    <span className="text-amber-600 dark:text-amber-400">&quot;+243810000000&quot;</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400">{'}'}</span>
                  </pre>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        200 OK
                      </span>
                      <span className="text-xs text-gray-400 font-mono">transaction_id: UP-83921</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-[#0d1420] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">4 réseaux connectés</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
