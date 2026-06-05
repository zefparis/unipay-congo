'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  FlaskConical, CheckCircle2, Loader2, AlertTriangle,
  ToggleLeft, ToggleRight, Play, ChevronDown, ChevronUp,
  ArrowRight,
} from 'lucide-react';

type Mode = 'sandbox' | 'live';
type Direction = 'collect' | 'payout';
type Operator = 'orange' | 'airtel' | 'afrimoney';

interface ModeData { mode: Mode; kyc_status: string }
interface TxResult {
  transaction_id: string;
  status: string;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  sandbox?: boolean;
  error?: string;
}

const SANDBOX_CODE = `curl -X POST https://api.unipaycongo.com/v1/payment/initiate \\
  -H "X-API-Key: up_your_api_key" \\
  -H "X-UniPay-Mode: sandbox" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operator": "orange",
    "direction": "collect",
    "amount": 5000,
    "currency": "CDF",
    "phone": "+243812345678"
  }'`;

const OPERATORS: Operator[] = ['orange', 'airtel', 'afrimoney'];

export default function SandboxPage() {
  const t = useTranslations('dashboard.sandbox');

  /* mode state */
  const [modeData, setModeData] = useState<ModeData | null>(null);
  const [loadingMode, setLoadingMode] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [switchSuccess, setSwitchSuccess] = useState('');

  /* test form */
  const [operator, setOperator] = useState<Operator>('orange');
  const [phone, setPhone] = useState('+243812345678');
  const [amount, setAmount] = useState('5000');
  const [direction, setDirection] = useState<Direction>('collect');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TxResult | null>(null);

  /* code panel */
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    fetch('/api/merchant/mode')
      .then((r) => r.json())
      .then((d: ModeData) => setModeData(d))
      .catch(() => setModeData({ mode: 'sandbox', kyc_status: 'pending' }))
      .finally(() => setLoadingMode(false));
  }, []);

  const handleSwitch = async (target: Mode) => {
    setSwitching(true);
    setSwitchError('');
    setSwitchSuccess('');

    const res = await fetch('/api/merchant/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: target }),
    });
    const data = await res.json() as { mode?: string; error?: string; kyc_status?: string };

    if (res.ok) {
      setModeData((prev) => prev ? { ...prev, mode: target } : { mode: target, kyc_status: '' });
      setSwitchSuccess(target === 'sandbox' ? t('switch_success_sandbox') : t('switch_success_live'));
      setTimeout(() => setSwitchSuccess(''), 3000);
    } else {
      setSwitchError(data.error ?? 'Error');
    }
    setSwitching(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    const res = await fetch('/api/merchant/sandbox/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, direction, amount: Number(amount), currency: 'CDF', phone }),
    });
    const data = await res.json() as TxResult;
    setTestResult(data);
    setTesting(false);
  };

  if (loadingMode) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  const currentMode = modeData?.mode ?? 'sandbox';
  const isSandbox = currentMode === 'sandbox';
  const kycApproved = modeData?.kyc_status === 'approved';

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/20">
            <FlaskConical className="text-amber-600 dark:text-amber-400" size={20} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">{t('subtitle')}</p>
      </div>

      {/* ── Mode toggle card ──────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('current_mode')}</p>
            <div className="flex items-center gap-2">
              {isSandbox
                ? <ToggleLeft size={22} className="text-amber-500" />
                : <ToggleRight size={22} className="text-[#1D9E75]" />
              }
              <span className={`text-base font-bold ${isSandbox ? 'text-amber-600 dark:text-amber-400' : 'text-[#1D9E75]'}`}>
                {isSandbox ? t('mode_sandbox') : t('mode_live')}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSwitch(isSandbox ? 'live' : 'sandbox')}
            disabled={switching || (!kycApproved && isSandbox)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isSandbox
                ? 'bg-[#1D9E75] hover:bg-[#178a65] text-white shadow-sm shadow-[#1D9E75]/20'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20'
            }`}
          >
            {switching ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            {switching ? t('switching') : (isSandbox ? t('switch_to_live') : t('switch_to_sandbox'))}
          </button>
        </div>

        {/* KYC gate warning */}
        {isSandbox && !kycApproved && (
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 dark:text-amber-300">{t('live_requires_kyc')}</p>
              <Link href="/dashboard/kyc" className="inline-flex items-center gap-1 text-[#1D9E75] font-semibold text-xs mt-1 hover:underline">
                {t('kyc_link')} →
              </Link>
            </div>
          </div>
        )}

        {switchError && (
          <p className="text-sm text-red-500 dark:text-red-400">{switchError}</p>
        )}
        {switchSuccess && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> {switchSuccess}
          </p>
        )}
      </div>

      {/* ── Test form (always usable — sends X-UniPay-Mode: sandbox) ── */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Play size={14} className="text-amber-500" />
          {t('test_form_title')}
        </h2>

        {/* Direction toggle */}
        <div className="flex gap-2">
          {(['collect', 'payout'] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                direction === d
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400'
              }`}
            >
              {d === 'collect' ? t('direction_collect') : t('direction_payout')}
            </button>
          ))}
        </div>

        {/* Operator */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">{t('operator_label')}</label>
          <div className="flex gap-2 flex-wrap">
            {OPERATORS.map((op) => (
              <button
                key={op}
                onClick={() => setOperator(op)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize border transition-all ${
                  operator === op
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Phone + Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">{t('phone_label')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phone_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-mono transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">{t('amount_label')}</label>
            <input
              type="number"
              min={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-mono transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleTest}
          disabled={testing || !phone || !amount}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm shadow-amber-500/20"
        >
          {testing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {testing ? t('running') : t('run_test')}
        </button>
      </div>

      {/* ── Result ───────────────────────────────────────────── */}
      {testResult && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-[#0d1420] flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('result_title')}</h3>
            {testResult.sandbox && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-800/40">sandbox</span>
            )}
          </div>
          <pre className="bg-[#0d1117] text-[#e6edf3] text-xs leading-relaxed p-5 overflow-x-auto overflow-y-auto max-h-64 font-mono">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Code example ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button
          onClick={() => setShowCode(!showCode)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#0d1420] text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FlaskConical size={15} className="text-amber-500" />
            {t('code_title')}
          </div>
          {showCode ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>
        {showCode && (
          <pre className="bg-[#0d1117] text-[#e6edf3] text-xs leading-relaxed p-5 overflow-x-auto font-mono">
            <code>{SANDBOX_CODE}</code>
          </pre>
        )}
      </div>

    </div>
  );
}
