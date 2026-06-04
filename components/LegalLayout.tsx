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
      <main className="min-h-screen bg-white dark:bg-[#0a0f1e] pt-16">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-16 lg:py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-[#0a0f1e] dark:via-[#0d1a2e] dark:to-[#0a0f1e]" />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#1D9E75 1px, transparent 1px), linear-gradient(90deg, #1D9E75 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="absolute top-0 right-[-5%] w-72 h-72 bg-[#1D9E75]/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#1D9E75] dark:hover:text-[#1D9E75] transition-colors mb-8"
            >
              <ArrowLeft size={14} />
              {back}
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/25 text-[#1D9E75] text-sm font-medium mb-5">
              {badge}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-4">
              {title}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-3">
              {subtitle}
            </p>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{updated}</p>
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="lg:grid lg:grid-cols-4 lg:gap-12 lg:items-start">

            {/* TOC — sticky sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1420] p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                  {tocLabel}
                </p>
                <nav className="space-y-0.5">
                  {sections.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-2.5 py-1.5 pl-3 text-sm text-gray-600 dark:text-gray-400 hover:text-[#1D9E75] dark:hover:text-[#1D9E75] border-l-2 border-transparent hover:border-[#1D9E75] transition-all duration-200 rounded-r"
                    >
                      <span className="text-xs text-gray-400 dark:text-gray-600 font-mono w-4 flex-shrink-0">
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
                  className="scroll-mt-24 py-10 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-start gap-4">
                    {/* Section number badge */}
                    <span className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center text-xs font-bold font-heading">
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-4">
                        {s.title}
                      </h2>

                      <div className="space-y-3">
                        {/* Body: single string or array of paragraphs */}
                        {Array.isArray(s.body)
                          ? s.body.map((p, j) => (
                              <p
                                key={j}
                                className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                              >
                                {p}
                              </p>
                            ))
                          : s.body && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {s.body}
                              </p>
                            )}

                        {/* Intro before list */}
                        {s.intro && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {s.intro}
                          </p>
                        )}

                        {/* Bullet list */}
                        {s.list && s.list.length > 0 && (
                          <ul className="space-y-2 mt-1">
                            {s.list.map((item, j) => (
                              <li key={j} className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1D9E75] flex-shrink-0" />
                                <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Footer text after list */}
                        {s.footer && (
                          <p className="text-sm text-[#1D9E75] font-medium leading-relaxed pt-1">
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
