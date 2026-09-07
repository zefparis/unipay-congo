'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch('/api/merchant/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    // Always show the same generic message regardless of response
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-navy px-4 pt-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="UniPay Congo" height={40} width={120} priority />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/40 backdrop-blur-sm">
          {!submitted ? (
            <>
              <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary mb-1">
                {t('forgot_password_title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-text-secondary mb-8">
                {t('forgot_password_subtitle')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-primary mb-1.5">
                    {t('forgot_password_email')}
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.email_placeholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel/50 text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-deep focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-green-deep hover:bg-green-deep/85 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-sm shadow-signal/25"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {loading ? t('forgot_password_loading') : t('forgot_password_submit')}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="text-green-deep" size={48} />
              </div>
              <p className="text-sm text-gray-700 dark:text-text-primary leading-relaxed mb-6">
                {t('forgot_password_success')}
              </p>
            </div>
          )}

          {/* Back to login */}
          <div className="text-center mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-text-secondary hover:text-green-deep dark:hover:text-green-deep transition-colors"
            >
              <ArrowLeft size={14} />
              {t('forgot_password_back')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
