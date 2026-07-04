'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  CheckCircle2, ChevronDown, ArrowRight, Zap,
  ShieldCheck, HeadphonesIcon, LayoutDashboard, Code2,
} from 'lucide-react';
import Footer from '@/components/Footer';

/* ── operator data ──────────────────────────────────────────── */
const OPERATORS = [
  { code: 'orange',    name: 'Orange Money',    color: '#FF7900', status: true  },
  { code: 'airtel',    name: 'Airtel Money',    color: '#E40000', status: true  },
  { code: 'afrimoney', name: 'Afrimoney',       color: '#0057A8', status: true  },
  { code: 'vodacash',  name: 'Vodacash/M-Pesa', color: '#E31837', status: false },
];

/* ── FAQ accordion item ─────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white group-hover:text-signal transition-colors">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180 text-signal' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
}

/* ── main page ──────────────────────────────────────────────── */
export default function PricingPage() {
  const t = useTranslations('pricing');

  const features = [t('f1'), t('f2'), t('f3'), t('f4'), t('f5'), t('f6'), t('f7'), t('f8')];

  const highlights = [
    { icon: Zap,              label: t('f4') },
    { icon: ShieldCheck,      label: t('f1') },
    { icon: HeadphonesIcon,   label: t('f5') },
    { icon: LayoutDashboard,  label: t('f8') },
  ];

  const faqs = [
    { q: t('faq_1_q'), a: t('faq_1_a') },
    { q: t('faq_2_q'), a: t('faq_2_a') },
    { q: t('faq_3_q'), a: t('faq_3_a') },
    { q: t('faq_4_q'), a: t('faq_4_a') },
    { q: t('faq_5_q'), a: t('faq_5_a') },
  ];

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-ink pt-16 overflow-x-hidden">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-ink dark:via-ink/80 dark:to-ink" />
          <div className="absolute top-0 right-[-5%] w-[500px] h-[500px] bg-signal/6 rounded-full blur-3xl pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035]"
            style={{
              backgroundImage: 'linear-gradient(#1C9E7A 1px,transparent 1px),linear-gradient(90deg,#1C9E7A 1px,transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-signal/10 border border-signal/25 text-signal text-sm font-medium mb-7">
              <Code2 size={14} />
              {t('badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-5">
              {t('title')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* ── Pricing card ──────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-lg mx-auto">
            {/* Card */}
            <div className="relative rounded-3xl border-2 border-signal/40 bg-white dark:bg-ink/60 shadow-2xl shadow-signal/10 overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-signal via-signal to-signal/70" />

              {/* Plan header */}
              <div className="px-5 sm:px-8 pt-7 sm:pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-signal uppercase tracking-widest">{t('plan_name')}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-signal/10 text-signal border border-signal/20">
                    RDC
                  </span>
                </div>

                {/* Rate */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-7xl font-heading font-bold text-gray-900 dark:text-white tracking-tight">
                    {t('rate')}
                  </span>
                </div>
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium mb-1">{t('rate_label')}</p>
                <p className="text-xs text-signal font-semibold">{t('rate_note')}</p>
              </div>

              {/* Features list */}
              <div className="px-5 sm:px-8 py-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{t('plan_desc')}</p>
                <ul className="space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2 size={17} className="text-signal flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-5 sm:px-8 pb-7 sm:pb-8">
                <Link
                  href="/register"
                  className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-signal text-white font-semibold text-base hover:bg-signal/85 transition-all duration-200 shadow-lg shadow-signal/25 hover:shadow-signal/40 hover:-translate-y-0.5"
                >
                  {t('cta')}
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Trust note */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
              🔒 {t('f3')} · {t('f2')}
            </p>
          </div>

          {/* Highlight icons — 4 across below card */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-signal/10 flex items-center justify-center">
                  <Icon size={20} className="text-signal" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Operators ─────────────────────────────────────────── */}
        <section className="bg-gray-50 dark:bg-ink/60 border-y border-gray-200 dark:border-gray-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                {t('ops_title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                {t('ops_subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-3xl mx-auto">
              {OPERATORS.map((op) => (
                <div
                  key={op.code}
                  className="relative flex flex-col items-center p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-ink overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: op.color }} />
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-heading font-bold text-white shadow-md mt-1 mb-3"
                    style={{ backgroundColor: op.color, boxShadow: `0 6px 20px ${op.color}40` }}
                  >
                    {op.name.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-2">{op.name}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    op.status
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {op.status ? '✅ Actif' : '🔜 Bientôt'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-10 text-center tracking-tight">
              {t('faq_title')}
            </h2>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-ink/60 px-6 sm:px-8 divide-y divide-gray-200 dark:divide-gray-800">
              {faqs.map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ────────────────────────────────────────── */}
        <section className="py-20 bg-gradient-to-br from-signal/8 via-transparent to-signal/8 dark:from-signal/10 dark:via-ink dark:to-signal/10 border-y border-signal/15 dark:border-signal/20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-signal flex items-center justify-center shadow-lg shadow-signal/30 mx-auto mb-6">
              <Zap size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              {t('cta_title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm sm:text-base">
              {t('cta_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-signal text-white font-semibold text-base hover:bg-signal/85 transition-all duration-200 shadow-lg shadow-signal/25 hover:shadow-signal/40 hover:-translate-y-0.5"
              >
                {t('cta')}
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/api"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-base hover:border-signal hover:text-signal dark:hover:border-signal dark:hover:text-signal transition-all duration-200"
              >
                <Code2 size={17} />
                Documentation API
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
