'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? t('error'));
      setLoading(false);
    }
  };

  const fields: { key: keyof typeof form; type: string; autoComplete: string }[] = [
    { key: 'name', type: 'text', autoComplete: 'organization' },
    { key: 'email', type: 'email', autoComplete: 'email' },
    { key: 'password', type: 'password', autoComplete: 'new-password' },
    { key: 'phone', type: 'tel', autoComplete: 'tel' },
    { key: 'country', type: 'text', autoComplete: 'country-name' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0f1e] px-4 py-24">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="UniPay Congo" height={40} width={120} priority />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl shadow-black/5 dark:shadow-black/40 backdrop-blur-sm">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="mx-auto mb-4 text-[#1D9E75]" size={48} />
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">{t('success')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('login_link')} →</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-1">{t('title')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('subtitle')}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(({ key, type: fieldType, autoComplete }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t(key as Parameters<typeof t>[0])}
                    </label>
                    <div className="relative">
                      <input
                        type={key === 'password' ? (showPassword ? 'text' : 'password') : fieldType}
                        required={key !== 'phone' && key !== 'country'}
                        autoComplete={autoComplete}
                        value={form[key]}
                        onChange={set(key)}
                        placeholder={t(`${key}_placeholder` as Parameters<typeof t>[0])}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all"
                      />
                      {key === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {error && (
                  <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a65] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-sm shadow-[#1D9E75]/25 mt-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? t('loading') : t('submit')}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                {t('has_account')}{' '}
                <Link href="/login" className="text-[#1D9E75] hover:text-[#178a65] font-medium">
                  {t('login_link')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
