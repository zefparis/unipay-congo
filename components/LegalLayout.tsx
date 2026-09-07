import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Footer from '@/components/Footer';

export interface LegalSection {
  id: string;
  title: string;
  body?: string | string[];
  intro?: string;
  list?: string[];
  footer?: string;
}

interface LegalLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  updated: string;
  tocLabel: string;
  back: string;
  sections: LegalSection[];
}

export default function LegalLayout({
  badge,
  title,
  subtitle,
  updated,
  tocLabel,
  back,
  sections,
}: LegalLayoutProps) {
  return (
    <>
      <main className="min-h-screen bg-white dark:bg-navy pt-16">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-16 lg:py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-navy dark:via-navy/80 dark:to-navy" />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#1C9E7A 1px, transparent 1px), linear-gradient(90deg, #1C9E7A 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="absolute top-0 right-[-5%] w-72 h-72 bg-green-deep/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-text-secondary hover:text-green-deep dark:hover:text-green-deep transition-colors mb-8"
            >
              <ArrowLeft size={14} />
              {back}
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-deep/10 border border-green-deep/25 text-green-deep text-sm font-medium mb-5">
              {badge}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 dark:text-text-primary leading-[1.1] tracking-tight mb-4">
              {title}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-text-secondary leading-relaxed max-w-2xl mb-3">
              {subtitle}
            </p>
            <p className="text-xs font-medium text-gray-400 dark:text-text-secondary/70">{updated}</p>
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">

          {/* Mobile TOC — inline jump list, hidden on lg */}
          <nav className="lg:hidden mb-8 rounded-xl border border-gray-100 dark:border-text-secondary/15 bg-gray-50/50 dark:bg-navy/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-text-secondary/70 mb-3">{tocLabel}</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-navy-panel border border-gray-200 dark:border-text-secondary/20 text-xs text-gray-600 dark:text-text-secondary hover:text-green-deep hover:border-green-deep transition-colors"
                >
                  <span className="text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          <div className="lg:grid lg:grid-cols-4 lg:gap-12 lg:items-start">

            {/* TOC — sticky sidebar, desktop only */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-100 dark:border-text-secondary/15 bg-gray-50/50 dark:bg-navy/60 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-text-secondary/70 mb-4">
                  {tocLabel}
                </p>
                <nav className="space-y-0.5">
                  {sections.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-2.5 py-1.5 pl-3 text-sm text-gray-600 dark:text-text-secondary hover:text-green-deep dark:hover:text-green-deep border-l-2 border-transparent hover:border-green-deep transition-all duration-200 rounded-r"
                    >
                      <span className="text-xs text-gray-400 dark:text-text-secondary/50 font-mono w-4 flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Sections */}
            <div className="lg:col-span-3 mt-8 lg:mt-0 space-y-0">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24 py-7 sm:py-10 border-b border-gray-100 dark:border-text-secondary/15 last:border-0"
                >
                  <div className="flex items-start gap-4">
                    {/* Section number badge */}
                    <span className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-green-deep/10 text-green-deep flex items-center justify-center text-xs font-bold font-serif">
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-serif font-semibold text-gray-900 dark:text-text-primary mb-4">
                        {s.title}
                      </h2>

                      <div className="space-y-3">
                        {/* Body: single string or array of paragraphs */}
                        {Array.isArray(s.body)
                          ? s.body.map((p, j) => (
                              <p
                                key={j}
                                className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed"
                              >
                                {p}
                              </p>
                            ))
                          : s.body && (
                              <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                                {s.body}
                              </p>
                            )}

                        {/* Intro before list */}
                        {s.intro && (
                          <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                            {s.intro}
                          </p>
                        )}

                        {/* Bullet list */}
                        {s.list && s.list.length > 0 && (
                          <ul className="space-y-2 mt-1">
                            {s.list.map((item, j) => (
                              <li key={j} className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-deep flex-shrink-0" />
                                <span className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Footer text after list */}
                        {s.footer && (
                          <p className="text-sm text-green-deep font-medium leading-relaxed pt-1">
                            {s.footer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </>
  );
}
