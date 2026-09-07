'use client';

import { useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('reset_password_error'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('reset_password_error'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/merchant/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? t('reset_password_error'));
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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

          {!token ? (
            // No token in URL
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <AlertCircle className="text-amber-500" size={48} />
              </div>
              <p className="text-sm text-gray-700 dark:text-text-primary mb-6">
                {t('reset_password_error')}
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-deep text-white text-sm font-semibold hover:bg-green-deep/85 transition-all"
              >
                {t('reset_password_back')}
              </Link>
            </div>
          ) : success ? (
            // Success state
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="text-green-deep" size={48} />
              </div>
              <p className="text-sm text-gray-700 dark:text-text-primary mb-2">
                {t('reset_password_success')}
              </p>
              <p className="text-xs text-gray-400 dark:text-text-secondary">
                Redirection vers la connexion…
              </p>
            </div>
          ) : (
            // Form
            <>
              <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary mb-1">
                {t('reset_password_title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-text-secondary mb-8">
                {t('reset_password_subtitle')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-primary mb-1.5">
                    {t('reset_password_new')}
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel/50 text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-deep focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-primary mb-1.5">
                    {t('reset_password_confirm')}
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel/50 text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-deep focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-green-deep hover:bg-green-deep/85 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-sm shadow-signal/25"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  {loading ? t('reset_password_loading') : t('reset_password_submit')}
                </button>
              </form>
            </>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-navy">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
