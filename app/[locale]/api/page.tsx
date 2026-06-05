'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Copy, Check, ExternalLink, Code2, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';

const BASE = 'https://unipay-api.onrender.com';

/* ── types ─────────────────────────────────────────────────── */
type Lang = 'shell' | 'node' | 'python';
interface CodeEx { shell: string; node: string; python: string }
interface Param  { field: string; type: string; req: boolean; desc: string }
interface Section {
  id: string; labelKey: string; method?: string; path?: string;
  descFr: string; descEn: string;
  params?: Param[]; response?: string; code?: CodeEx;
}

/* ── helper: inline code colors ────────────────────────────── */
function kw(s: string)  { return `\x1b[kw]${s}\x1b[/]` }   // unused – we just render plain

/* ── CopyButton ─────────────────────────────────────────────── */
function CopyButton({ text, label, labelDone }: { text: string; label: string; labelDone: string }) {
  const [done, setDone] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors">
      {done ? <Check size={12} className="text-[#1D9E75]" /> : <Copy size={12} />}
      {done ? labelDone : label}
    </button>
  );
}

/* ── CodeBlock ──────────────────────────────────────────────── */
function CodeBlock({ ex, copyLabel, copiedLabel }: { ex: CodeEx; copyLabel: string; copiedLabel: string }) {
  const [lang, setLang] = useState<Lang>('shell');
  const TABS: { id: Lang; label: string }[] = [
    { id: 'shell', label: 'cURL' }, { id: 'node', label: 'Node.js' }, { id: 'python', label: 'Python' },
  ];
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700/60 bg-[#0d1117] text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700/60">
        <div className="flex gap-0.5">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setLang(id)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${lang === id ? 'bg-[#1D9E75]/20 text-[#1D9E75]' : 'text-gray-500 hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
        <CopyButton text={ex[lang]} label={copyLabel} labelDone={copiedLabel} />
      </div>
      <pre className="p-4 text-gray-300 font-mono leading-relaxed overflow-x-auto text-[13px] whitespace-pre">{ex[lang]}</pre>
    </div>
  );
}

/* ── MethodBadge ────────────────────────────────────────────── */
function MethodBadge({ m }: { m: string }) {
  const cls = m === 'GET'
    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : 'bg-[#1D9E75]/15 text-[#1D9E75] border-[#1D9E75]/30';
  return <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${cls}`}>{m}</span>;
}

/* ── ParamTable ─────────────────────────────────────────────── */
function ParamTable({ params, labels }: { params: Param[]; labels: { field: string; type: string; req: string; desc: string; yes: string; no: string } }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-[#0d1420] border-b border-gray-200 dark:border-gray-800">
            {[labels.field, labels.type, labels.req, labels.desc].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-[#1D9E75]">{p.field}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">{p.type}</td>
              <td className="px-4 py-2.5">
                <span className={`text-xs font-semibold ${p.req ? 'text-red-500' : 'text-gray-400'}`}>
                  {p.req ? labels.yes : labels.no}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── ResponseBlock ──────────────────────────────────────────── */
function ResponseBlock({ json, label, copyLabel, copiedLabel }: { json: string; label: string; copyLabel: string; copiedLabel: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700/60 bg-[#0d1117] text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700/60">
        <span className="text-xs font-mono text-gray-400">{label}</span>
        <CopyButton text={json} label={copyLabel} labelDone={copiedLabel} />
      </div>
      <pre className="p-4 text-gray-300 font-mono leading-relaxed overflow-x-auto text-[13px] whitespace-pre">{json}</pre>
    </div>
  );
}

/* ── DATA ───────────────────────────────────────────────────── */
const OPERATORS = [
  { code: 'orange',    name: 'Orange Money',   status: '✅ Actif',    statusEn: '✅ Active' },
  { code: 'airtel',    name: 'Airtel Money',   status: '✅ Actif',    statusEn: '✅ Active' },
  { code: 'afrimoney', name: 'Afrimoney',      status: '✅ Actif',    statusEn: '✅ Active' },
  { code: 'vodacash',  name: 'Vodacash/M-Pesa',status: '🔜 Bientôt', statusEn: '🔜 Soon' },
];
const ERRORS = [
  { code: '400', desc: 'Erreur de validation des champs',  descEn: 'Field validation error' },
  { code: '401', desc: 'Identifiants invalides',           descEn: 'Invalid credentials' },
  { code: '403', desc: 'Accès non autorisé',               descEn: 'Unauthorized access' },
  { code: '429', desc: 'Limite dépassée (60 req/min)',     descEn: 'Rate limit exceeded (60 req/min)' },
  { code: '500', desc: 'Erreur interne serveur',           descEn: 'Internal server error' },
];

const collectCode: CodeEx = {
  shell: `curl -X POST ${BASE}/v1/payment/initiate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: up_your_api_key" \\
  -d '{
    "operator": "orange",
    "phone": "+243810000000",
    "amount": 5000,
    "reference": "ORDER-001",
    "direction": "collect"
  }'`,
  node: `const res = await fetch('${BASE}/v1/payment/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'up_your_api_key',
  },
  body: JSON.stringify({
    operator: 'orange',
    phone: '+243810000000',
    amount: 5000,
    reference: 'ORDER-001',
    direction: 'collect',
  }),
});
const data = await res.json();`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/payment/initiate',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'up_your_api_key',
    },
    json={
        'operator': 'orange',
        'phone': '+243810000000',
        'amount': 5000,
        'reference': 'ORDER-001',
        'direction': 'collect',
    }
)
print(r.json())`,
};

const payoutCode: CodeEx = {
  shell: `curl -X POST ${BASE}/v1/payment/initiate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: up_your_api_key" \\
  -d '{
    "operator": "airtel",
    "phone": "+243820000000",
    "amount": 10000,
    "reference": "PAYOUT-042",
    "direction": "payout"
  }'`,
  node: `const res = await fetch('${BASE}/v1/payment/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'up_your_api_key',
  },
  body: JSON.stringify({
    operator: 'airtel',
    phone: '+243820000000',
    amount: 10000,
    reference: 'PAYOUT-042',
    direction: 'payout',
  }),
});
const data = await res.json();`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/payment/initiate',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'up_your_api_key',
    },
    json={
        'operator': 'airtel',
        'phone': '+243820000000',
        'amount': 10000,
        'reference': 'PAYOUT-042',
        'direction': 'payout',
    }
)
print(r.json())`,
};

const statusCode: CodeEx = {
  shell: `curl ${BASE}/v1/payment/status/TXN-83921 \\
  -H "X-API-Key: up_your_api_key"`,
  node: `const res = await fetch(
  '${BASE}/v1/payment/status/TXN-83921',
  { headers: { 'X-API-Key': 'up_your_api_key' } }
);
const data = await res.json();`,
  python: `import requests

r = requests.get(
    '${BASE}/v1/payment/status/TXN-83921',
    headers={'X-API-Key': 'up_your_api_key'}
)
print(r.json())`,
};

const balanceCode: CodeEx = {
  shell: `curl ${BASE}/v1/merchant/balance \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
  node: `const res = await fetch('${BASE}/v1/merchant/balance', {
  headers: { 'Authorization': \`Bearer \${token}\` },
});
const data = await res.json();`,
  python: `import requests

r = requests.get(
    '${BASE}/v1/merchant/balance',
    headers={'Authorization': f'Bearer {token}'}
)
print(r.json())`,
};

const historyCode: CodeEx = {
  shell: `curl "${BASE}/v1/merchant/transactions?page=1&limit=20&operator=orange&status=success" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
  node: `const params = new URLSearchParams({
  page: '1', limit: '20',
  operator: 'orange', status: 'success',
});
const res = await fetch(
  \`${BASE}/v1/merchant/transactions?\${params}\`,
  { headers: { 'Authorization': \`Bearer \${token}\` } }
);
const data = await res.json();`,
  python: `import requests

r = requests.get(
    '${BASE}/v1/merchant/transactions',
    headers={'Authorization': f'Bearer {token}'},
    params={'page': 1, 'limit': 20,
            'operator': 'orange', 'status': 'success'}
)
print(r.json())`,
};

const apikeyCode: CodeEx = {
  shell: `curl -X POST ${BASE}/v1/merchant/apikey \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
  node: `const res = await fetch('${BASE}/v1/merchant/apikey', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${token}\` },
});
const { api_key } = await res.json();
// ⚠ Save this key — it is shown only once`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/merchant/apikey',
    headers={'Authorization': f'Bearer {token}'}
)
data = r.json()
# ⚠ Save this key — it is shown only once
print(data['api_key'])`,
};

const authCode: CodeEx = {
  shell: `# API Key (payments)
curl ${BASE}/v1/payment/initiate \\
  -H "X-API-Key: up_your_api_key" \\
  ...

# JWT Bearer (dashboard routes)
curl ${BASE}/v1/merchant/balance \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
  node: `// API Key — payments
const headers = { 'X-API-Key': 'up_your_api_key' };

// JWT Bearer — dashboard / merchant routes
const bearerHeaders = {
  'Authorization': \`Bearer \${jwtToken}\`,
};`,
  python: `# API Key — payments
headers = {'X-API-Key': 'up_your_api_key'}

# JWT Bearer — dashboard / merchant routes
bearer_headers = {
    'Authorization': f'Bearer {jwt_token}'
}`,
};

const paymentParams: Param[] = [
  { field: 'operator',  type: 'string',  req: true,  desc: 'orange | airtel | afrimoney | vodacash' },
  { field: 'phone',     type: 'string',  req: true,  desc: 'Numéro mobile E.164 (+243…)' },
  { field: 'amount',    type: 'number',  req: true,  desc: 'Montant en CDF (> 0)' },
  { field: 'reference', type: 'string',  req: false, desc: 'Référence interne de votre système' },
  { field: 'direction', type: 'string',  req: true,  desc: '"collect" ou "payout"' },
];
const historyParams: Param[] = [
  { field: 'page',     type: 'number', req: false, desc: 'Page (défaut: 1)' },
  { field: 'limit',    type: 'number', req: false, desc: 'Par page, max 100 (défaut: 20)' },
  { field: 'operator', type: 'string', req: false, desc: 'Filtrer par opérateur' },
  { field: 'status',   type: 'string', req: false, desc: 'pending | processing | success | failed | cancelled' },
  { field: 'direction',type: 'string', req: false, desc: 'collect | payout' },
];

const PAYMENT_RESPONSE = `{
  "transaction_id": "TXN-83921",
  "status": "pending",
  "amount": 5000,
  "fee": 200,
  "net_amount": 4800,
  "currency": "CDF"
}`;
const STATUS_RESPONSE = `{
  "transaction_id": "TXN-83921",
  "status": "success",
  "operator": "orange",
  "phone": "+243810000000",
  "amount": 5000,
  "fee": 200,
  "net_amount": 4800,
  "currency": "CDF",
  "created_at": "2026-06-04T20:00:00.000Z"
}`;
const BALANCE_RESPONSE = `{
  "balance_cdf": 245000,
  "currency": "CDF"
}`;
const HISTORY_RESPONSE = `{
  "data": [
    {
      "id": "TXN-83921",
      "operator": "orange",
      "phone": "+243810000000",
      "amount": 5000,
      "fee": 200,
      "net_amount": 4800,
      "status": "success",
      "direction": "collect",
      "created_at": "2026-06-04T20:00:00.000Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}`;
const APIKEY_RESPONSE = `{
  "api_key": "up_a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5",
  "key_prefix": "up_a3f9",
  "created_at": "2026-06-04T20:00:00.000Z"
}`;

/* ── Main page component ────────────────────────────────────── */
export default function ApiDocPage() {
  const t = useTranslations('api_doc');
  const locale = useLocale();
  const isFr = locale === 'fr';

  const NAV = [
    { id: 'base-url',     label: t('s_base_url') },
    { id: 'auth',         label: t('s_auth') },
    { id: 'collect',      label: t('s_collect') },
    { id: 'payout',       label: t('s_payout') },
    { id: 'tx-status',    label: t('s_status') },
    { id: 'balance',      label: t('s_balance') },
    { id: 'history',      label: t('s_history') },
    { id: 'apikey',       label: t('s_apikey') },
    { id: 'operators',    label: t('s_operators') },
    { id: 'errors',       label: t('s_errors') },
    { id: 'fees',         label: t('s_fees') },
  ];

  const [active, setActive] = useState('base-url');
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }); },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cp  = t('copy');
  const cpd = t('copied');
  const paramLabels = { field: t('param_field'), type: t('param_type'), req: t('param_required'), desc: t('param_desc'), yes: t('required'), no: t('optional') };

  /* ── section helpers ───────────────────────────────────────── */
  const SectionHeader = ({ id, method, path, label }: { id: string; method?: string; path?: string; label: string }) => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {method && <MethodBadge m={method} />}
      {path && (
        <code className="text-sm font-mono text-gray-200 bg-[#0d1117] border border-gray-700/60 px-3 py-1 rounded-lg">
          {path}
        </code>
      )}
      {!method && <h2 id={id} className="scroll-mt-20 text-xl font-heading font-bold text-gray-900 dark:text-white">{label}</h2>}
    </div>
  );

  const EndpointTitle = ({ id, label, method, path }: { id: string; label: string; method: string; path: string }) => (
    <div className="scroll-mt-20" id={id}>
      <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-3">{label}</h2>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <MethodBadge m={method} />
        <code className="text-sm font-mono text-gray-300 bg-[#0d1117] border border-gray-700/60 px-3 py-1 rounded-lg">
          {BASE}{path}
        </code>
        <CopyButton text={`${BASE}${path}`} label={cp} labelDone={cpd} />
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-[#0a0f1e] pt-16">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-14 lg:py-20 border-b border-gray-200 dark:border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-[#0a0f1e] dark:via-[#0d1a2e] dark:to-[#0a0f1e]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1D9E75]/6 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/25 text-[#1D9E75] text-xs font-semibold mb-5">
              <Code2 size={13} /> {t('badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-4">
              {t('title')}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed mb-6">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
                {BASE}
              </div>
              <a href={BASE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#1D9E75] transition-colors">
                <ExternalLink size={12} /> API Status
              </a>
            </div>
          </div>
        </section>

        {/* ── Mobile section nav ────────────────────────────────── */}
        <div className="lg:hidden sticky top-16 z-30 bg-white dark:bg-[#0a0f1e] border-b border-gray-200 dark:border-gray-800 px-4 py-2">
          <select
            onChange={e => scrollTo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1420] text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50"
          >
            <option value="">{t('mobile_nav')}</option>
            {NAV.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="lg:flex lg:gap-10">

            {/* ── Desktop sidebar ───────────────────────────────── */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-2">{t('on_this_page')}</p>
                <nav className="space-y-0.5">
                  {NAV.map(({ id, label }) => (
                    <button key={id} onClick={() => scrollTo(id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                        active === id
                          ? 'bg-[#1D9E75]/10 text-[#1D9E75] dark:bg-[#1D9E75]/15 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}>
                      {active === id && <span className="w-1 h-1 rounded-full bg-[#1D9E75] flex-shrink-0" />}
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ── Content ───────────────────────────────────────── */}
            <div ref={mainRef} className="flex-1 min-w-0 space-y-16">

              {/* BASE URL */}
              <section id="base-url" className="scroll-mt-20">
                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-4">{t('s_base_url')}</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? 'Toutes les requêtes doivent pointer vers le serveur de production suivant. L\'API utilise HTTPS exclusivement.' : 'All requests must target the following production server. The API uses HTTPS exclusively.'}
                    </p>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#0d1420] border border-gray-200 dark:border-gray-800">
                      <ShieldCheck size={16} className="text-[#1D9E75] flex-shrink-0" />
                      <code className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 break-all">{BASE}</code>
                      <CopyButton text={BASE} label={cp} labelDone={cpd} />
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-700/60 bg-[#0d1117]">
                    <div className="px-4 py-2 bg-[#161b22] border-b border-gray-700/60 text-xs font-mono text-gray-500">Base URL</div>
                    <pre className="p-4 text-[13px] font-mono text-gray-300 leading-relaxed">{`# Production
${BASE}

# All endpoints are prefixed with /v1
${BASE}/v1/payment/initiate
${BASE}/v1/merchant/balance`}</pre>
                  </div>
                </div>
              </section>

              {/* AUTHENTICATION */}
              <section id="auth" className="scroll-mt-20">
                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-4">{t('s_auth')}</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? "L'API supporte deux méthodes d'authentification :" : 'The API supports two authentication methods:'}
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1420]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">X-API-Key</span>
                          <span className="text-xs text-gray-500">{isFr ? 'Pour les paiements' : 'For payments'}</span>
                        </div>
                        <code className="text-xs font-mono text-gray-600 dark:text-gray-400">X-API-Key: up_xxxxxxxxxxxxx</code>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1420]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40">Bearer</span>
                          <span className="text-xs text-gray-500">{isFr ? 'Pour le tableau de bord marchand' : 'For merchant dashboard'}</span>
                        </div>
                        <code className="text-xs font-mono text-gray-600 dark:text-gray-400">Authorization: Bearer &lt;jwt&gt;</code>
                      </div>
                    </div>
                  </div>
                  <CodeBlock ex={authCode} copyLabel={cp} copiedLabel={cpd} />
                </div>
              </section>

              {/* COLLECT */}
              <section id="collect" className="scroll-mt-20">
                <EndpointTitle id="collect" label={t('s_collect')} method="POST" path="/v1/payment/initiate" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? 'Initie une demande de paiement (débit) depuis un abonné Mobile Money vers votre compte marchand.' : 'Initiates a payment request (debit) from a Mobile Money subscriber to your merchant account.'}
                    </p>
                    <ParamTable params={paymentParams} labels={paramLabels} />
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={collectCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={PAYMENT_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* PAYOUT */}
              <section id="payout" className="scroll-mt-20">
                <EndpointTitle id="payout" label={t('s_payout')} method="POST" path="/v1/payment/initiate" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? 'Envoie un paiement (crédit) depuis votre compte marchand vers un abonné Mobile Money. Même endpoint que Collect, avec direction: "payout".' : 'Sends a payment (credit) from your merchant account to a Mobile Money subscriber. Same endpoint as Collect, with direction: "payout".'}
                    </p>
                    <ParamTable params={paymentParams} labels={paramLabels} />
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={payoutCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={PAYMENT_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* TRANSACTION STATUS */}
              <section id="tx-status" className="scroll-mt-20">
                <EndpointTitle id="tx-status" label={t('s_status')} method="GET" path="/v1/payment/status/:id" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? 'Retourne le statut actuel d\'une transaction. Utile pour les callbacks ou le polling.' : 'Returns the current status of a transaction. Useful for callbacks or polling.'}
                    </p>
                    <ParamTable params={[{ field: ':id', type: 'string', req: true, desc: isFr ? 'ID de la transaction (transaction_id retourné à l\'initiation)' : 'Transaction ID (returned at initiation)' }]} labels={paramLabels} />
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'processing', 'success', 'failed', 'cancelled'].map(s => (
                        <span key={s} className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                          s === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                          s === 'failed' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                          s === 'processing' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={statusCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={STATUS_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* BALANCE */}
              <section id="balance" className="scroll-mt-20">
                <EndpointTitle id="balance" label={t('s_balance')} method="GET" path="/v1/merchant/balance" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? 'Retourne le solde total CDF du compte marchand. Requiert un Bearer JWT obtenu via /v1/merchant/login.' : 'Returns the total CDF balance of the merchant account. Requires a Bearer JWT obtained via /v1/merchant/login.'}
                    </p>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400">
                      🔐 {isFr ? 'Authentification JWT requise (Authorization: Bearer)' : 'JWT authentication required (Authorization: Bearer)'}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={balanceCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={BALANCE_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* TRANSACTION HISTORY */}
              <section id="history" className="scroll-mt-20">
                <EndpointTitle id="history" label={t('s_history')} method="GET" path="/v1/merchant/transactions" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? 'Retourne l\'historique paginé des transactions avec filtres optionnels.' : 'Returns the paginated transaction history with optional filters.'}
                    </p>
                    <ParamTable params={historyParams} labels={paramLabels} />
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={historyCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={HISTORY_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* API KEY */}
              <section id="apikey" className="scroll-mt-20">
                <EndpointTitle id="apikey" label={t('s_apikey')} method="POST" path="/v1/merchant/apikey" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isFr ? 'Génère une nouvelle clé API. L\'ancienne clé est immédiatement révoquée. La clé en clair n\'est retournée qu\'une seule fois.' : 'Generates a new API key. The old key is immediately revoked. The plaintext key is returned only once.'}
                    </p>
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-400">
                      ⚠️ {isFr ? 'Sauvegardez immédiatement la clé retournée. Elle ne sera plus affichée.' : 'Save the returned key immediately. It will not be shown again.'}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={apikeyCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={APIKEY_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* OPERATORS */}
              <section id="operators" className="scroll-mt-20">
                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-4">{t('s_operators')}</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-[#0d1420] border-b border-gray-200 dark:border-gray-800">
                        {['Code', isFr ? 'Opérateur' : 'Operator', isFr ? 'Pays' : 'Country', 'Statut / Status'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {OPERATORS.map((op, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                          <td className="px-5 py-3.5"><code className="text-xs font-mono font-bold text-[#1D9E75]">{op.code}</code></td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-800 dark:text-gray-200">{op.name}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">RDC</td>
                          <td className="px-5 py-3.5 text-sm">{isFr ? op.status : op.statusEn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ERROR CODES */}
              <section id="errors" className="scroll-mt-20">
                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-4">{t('s_errors')}</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-[#0d1420] border-b border-gray-200 dark:border-gray-800">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">Code HTTP</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ERRORS.map((e, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                              e.code.startsWith('4') ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40' :
                              'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40'
                            }`}>{e.code}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{isFr ? e.desc : e.descEn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* FEES */}
              <section id="fees" className="scroll-mt-20">
                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-4">{t('s_fees')}</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: isFr ? 'Commission' : 'Fee', value: '4%', sub: isFr ? 'par transaction (TTC)' : 'per transaction (all-in)' },
                    { label: isFr ? 'Devise' : 'Currency', value: 'CDF', sub: isFr ? 'Franc Congolais' : 'Congolese Franc' },
                    { label: 'Settlement', value: 'J+1', sub: isFr ? 'jours ouvrés' : 'business days' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1420] text-center">
                      <div className="text-3xl font-heading font-bold text-[#1D9E75] mb-1">{value}</div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">{label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{sub}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {isFr
                    ? 'Les frais de 4% sont prélevés sur chaque transaction (collect et payout). Le net_amount retourné dans la réponse correspond au montant après déduction des frais.'
                    : 'The 4% fee is deducted from each transaction (collect and payout). The net_amount in the response is the amount after fee deduction.'}
                </p>
              </section>

            </div>{/* end content */}
          </div>{/* end flex */}
        </div>{/* end container */}
      </div>

      <Footer />
    </>
  );
}
