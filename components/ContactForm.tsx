'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle2, X } from 'lucide-react';

interface FormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
}

const EMPTY: FormState = { name: '', company: '', email: '', phone: '', message: '' };

export default function ContactForm() {
  const t = useTranslations('contact_page');

  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const id = setTimeout(() => setShowToast(false), 4500);
    return () => clearTimeout(id);
  }, [showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setForm(EMPTY);
    setShowToast(true);
  };

  const inputBase =
    'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1420] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50 focus:border-[#1D9E75] dark:focus:border-[#1D9E75] transition-colors duration-200';

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Name + Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              {t('form_name')} <span className="text-[#1D9E75]">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder={t('form_name_placeholder')}
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              {t('form_company')}
            </label>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder={t('form_company_placeholder')}
              className={inputBase}
            />
          </div>
        </div>

        {/* Row 2: Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              {t('form_email')} <span className="text-[#1D9E75]">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder={t('form_email_placeholder')}
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              {t('form_phone')}
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder={t('form_phone_placeholder')}
              className={inputBase}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            {t('form_message')} <span className="text-[#1D9E75]">*</span>
          </label>
          <textarea
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={handleChange}
            placeholder={t('form_message_placeholder')}
            className={`${inputBase} resize-none`}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="group w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-base hover:bg-[#178a65] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#1D9E75]/25 hover:shadow-[#1D9E75]/40 hover:-translate-y-0.5"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {t('form_sending')}
            </>
          ) : (
            <>
              {t('form_submit')}
              <Send size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Success toast */}
      <div
        className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#1D9E75] text-white shadow-2xl shadow-[#1D9E75]/30 max-w-sm transition-all duration-500 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 size={20} className="flex-shrink-0" />
        <p className="text-sm font-medium leading-snug">{t('toast_success')}</p>
        <button
          onClick={() => setShowToast(false)}
          className="ml-auto p-0.5 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </>
  );
}
