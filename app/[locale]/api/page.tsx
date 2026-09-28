'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Copy, Check, ExternalLink, Code2, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';

const BASE = 'https://api.unipaycongo.com';
const TXID = '9b7c2e1a-3f45-4d6b-8a21-7c9e0d4f5b6a';

/* ── types ─────────────────────────────────────────────────── */
type Lang = 'shell' | 'node' | 'python';
interface CodeEx { shell: string; node: string; python: string }
interface Param  { field: string; type: string; req: boolean; desc: string }

/* ── CopyButton ─────────────────────────────────────────────── */
function CopyButton({ text, label, labelDone }: { text: string; label: string; labelDone: string }) {
  const [done, setDone] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors">
      {done ? <Check size={12} className="text-green-deep" /> : <Copy size={12} />}
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
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${lang === id ? 'bg-green-deep/20 text-green-deep' : 'text-gray-500 hover:text-gray-300'}`}>
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
    : m === 'DELETE'
    ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : 'bg-green-deep/15 text-green-deep border-green-deep/30';
  return <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${cls}`}>{m}</span>;
}

/* ── ParamTable ─────────────────────────────────────────────── */
function ParamTable({ params, labels }: { params: Param[]; labels: { field: string; type: string; req: string; desc: string; yes: string; no: string } }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-text-secondary/15 text-sm">
      <table className="w-full min-w-[480px]">
        <thead>
          <tr className="bg-gray-50 dark:bg-navy/60 border-b border-gray-200 dark:border-text-secondary/15">
            {[labels.field, labels.type, labels.req, labels.desc].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-text-secondary">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-text-secondary/15 last:border-0 hover:bg-gray-50/50 dark:hover:bg-navy-panel/30 transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-green-deep whitespace-nowrap">{p.field}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-text-secondary whitespace-nowrap">{p.type}</td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <span className={`text-xs font-semibold ${p.req ? 'text-red-500' : 'text-gray-400'}`}>
                  {p.req ? labels.yes : labels.no}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-text-secondary leading-relaxed">{p.desc}</td>
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
  { code: 'orange',    name: 'Orange Money' },
  { code: 'airtel',    name: 'Airtel Money' },
  { code: 'afrimoney', name: 'Afrimoney' },
];

const ERRORS = [
  { code: '400',                              desc: 'Erreur de validation des champs (schéma de la requête)',              descEn: 'Request field validation error (schema)' },
  { code: '400 INVALID_CURRENCY',             desc: 'Devise non supportée pour l\'opérateur choisi (CDF ou USD pour le Mobile Money)', descEn: 'Currency not supported for the selected operator (CDF or USD for Mobile Money)' },
  { code: '400 INVALID_PHONE',                desc: 'Numéro invalide : 9 chiffres significatifs requis (+243XXXXXXXXX, 0XXXXXXXXX ou XXXXXXXXX)', descEn: 'Invalid phone number: 9 significant digits required (+243XXXXXXXXX, 0XXXXXXXXX or XXXXXXXXX)' },
  { code: '400 OPERATOR_PHONE_MISMATCH',      desc: 'Payout uniquement : le numéro n\'appartient pas à l\'opérateur choisi (champ detected_operator fourni)', descEn: 'Payout only: the phone number does not belong to the selected operator (detected_operator field provided)' },
  { code: '401',                              desc: 'Clé API manquante/invalide, ou JWT absent/expiré',                    descEn: 'Missing/invalid API key, or absent/expired JWT' },
  { code: '402 INSUFFICIENT_MERCHANT_BALANCE', desc: 'Solde marchand insuffisant pour ce payout',                          descEn: 'Insufficient merchant balance for this payout' },
  { code: '403',                              desc: 'Compte suspendu, ou accès non autorisé',                              descEn: 'Suspended account, or unauthorized access' },
  { code: '403 KYC_REQUIRED_FOR_PAYOUT',      desc: 'Validation KYC requise avant de pouvoir initier des payouts',         descEn: 'KYC validation required before initiating payouts' },
  { code: '404',                              desc: 'Transaction introuvable (ou route inexistante)',                      descEn: 'Transaction not found (or unknown route)' },
  { code: '409 DUPLICATE_REFERENCE',          desc: 'Une transaction terminée existe déjà avec cette reference ; la réponse contient existing_transaction_id et existing_status. Utilisez une nouvelle référence', descEn: 'A completed transaction already exists with this reference; the response includes existing_transaction_id and existing_status. Use a new reference' },
  { code: '429',                              desc: 'Limite dépassée (60 req/min par IP)',                                 descEn: 'Rate limit exceeded (60 req/min per IP)' },
  { code: '500',                              desc: 'Erreur interne serveur',                                              descEn: 'Internal server error' },
  { code: '502 PROVIDER_REJECTED',            desc: 'Paiement rejeté par l\'opérateur (provider_code et transaction_id fournis)', descEn: 'Payment rejected by the operator (provider_code and transaction_id provided)' },
  { code: '503 PROVIDER_TEMPORARILY_UNAVAILABLE', desc: 'Opérateur momentanément indisponible, réessayez plus tard',       descEn: 'Operator temporarily unavailable, retry later' },
  { code: '503 INSUFFICIENT_PROVIDER_BALANCE', desc: 'Solde provider insuffisant pour ce payout, réessayez dans un instant', descEn: 'Provider balance insufficient for this payout, retry shortly' },
];

/* ── code examples ──────────────────────────────────────────── */
const loginCode: CodeEx = {
  shell: `curl -X POST ${BASE}/v1/merchant/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "vous@exemple.com",
    "password": "votre-mot-de-passe"
  }'`,
  node: `const res = await fetch('${BASE}/v1/merchant/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'vous@exemple.com',
    password: 'votre-mot-de-passe',
  }),
});
const { access_token } = await res.json();`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/merchant/login',
    json={'email': 'vous@exemple.com',
          'password': 'votre-mot-de-passe'}
)
token = r.json()['access_token']`,
};

const collectCode: CodeEx = {
  shell: `curl -X POST ${BASE}/v1/payment/initiate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: upk_live_xxxxxxxx" \\
  -d '{
    "operator": "orange",
    "direction": "collect",
    "phone": "+243890000000",
    "amount": 5000,
    "currency": "CDF",
    "reference": "ORDER-001"
  }'`,
  node: `const res = await fetch('${BASE}/v1/payment/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'upk_live_xxxxxxxx',
  },
  body: JSON.stringify({
    operator: 'orange',
    direction: 'collect',
    phone: '+243890000000',
    amount: 5000,
    currency: 'CDF',
    reference: 'ORDER-001',
  }),
});
const data = await res.json();`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/payment/initiate',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'upk_live_xxxxxxxx',
    },
    json={
        'operator': 'orange',
        'direction': 'collect',
        'phone': '+243890000000',
        'amount': 5000,
        'currency': 'CDF',
        'reference': 'ORDER-001',
    }
)
print(r.json())`,
};

const payoutCode: CodeEx = {
  shell: `curl -X POST ${BASE}/v1/payment/initiate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: upk_live_xxxxxxxx" \\
  -d '{
    "operator": "airtel",
    "direction": "payout",
    "phone": "+243990000000",
    "amount": 10000,
    "currency": "CDF",
    "reference": "PAYOUT-042"
  }'`,
  node: `const res = await fetch('${BASE}/v1/payment/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'upk_live_xxxxxxxx',
  },
  body: JSON.stringify({
    operator: 'airtel',
    direction: 'payout',
    phone: '+243990000000',
    amount: 10000,
    currency: 'CDF',
    reference: 'PAYOUT-042',
  }),
});
const data = await res.json();`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/payment/initiate',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'upk_live_xxxxxxxx',
    },
    json={
        'operator': 'airtel',
        'direction': 'payout',
        'phone': '+243990000000',
        'amount': 10000,
        'currency': 'CDF',
        'reference': 'PAYOUT-042',
    }
)
print(r.json())`,
};

const statusCode: CodeEx = {
  shell: `curl ${BASE}/v1/payment/${TXID}/status \\
  -H "X-API-Key: upk_live_xxxxxxxx"`,
  node: `const res = await fetch(
  '${BASE}/v1/payment/${TXID}/status',
  { headers: { 'X-API-Key': 'upk_live_xxxxxxxx' } }
);
const data = await res.json();`,
  python: `import requests

r = requests.get(
    '${BASE}/v1/payment/${TXID}/status',
    headers={'X-API-Key': 'upk_live_xxxxxxxx'}
)
print(r.json())`,
};

const webhookConfigCode: CodeEx = {
  shell: `# Configurer l'URL (HTTPS obligatoire)
curl -X POST ${BASE}/v1/merchant/webhook \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"webhook_url": "https://votre-domaine.com/webhooks/unipay"}'

# Envoyer un evenement de test
curl -X POST ${BASE}/v1/merchant/webhook/test \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Supprimer la configuration
curl -X DELETE ${BASE}/v1/merchant/webhook \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
  node: `await fetch('${BASE}/v1/merchant/webhook', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    webhook_url: 'https://votre-domaine.com/webhooks/unipay',
  }),
});
// -> { webhook_url, webhook_secret: 'whsec_...', note }`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/merchant/webhook',
    headers={'Authorization': f'Bearer {token}'},
    json={'webhook_url': 'https://votre-domaine.com/webhooks/unipay'}
)
# -> {'webhook_url': ..., 'webhook_secret': 'whsec_...', 'note': ...}`,
};

const webhookVerifyCode: CodeEx = {
  shell: `# Header recu sur chaque evenement :
# X-UniPay-Signature: sha256=<hmac_hex>
#
# HMAC-SHA256 calcule sur le body brut (raw body),
# avec votre webhook_secret (whsec_...)`,
  node: `const crypto = require('crypto');

function verifySignature(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)              // body brut, pas JSON.parse
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expected)
  );
}

// Express : utiliser express.raw({ type: 'application/json' })
// pour conserver le body brut.`,
  python: `import hmac, hashlib

def verify_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    expected = 'sha256=' + hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature_header, expected)

# Flask : raw_body = request.get_data()`,
};

const sandboxCode: CodeEx = {
  shell: `# Lire le mode courant
curl ${BASE}/v1/merchant/mode \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Basculer en sandbox (ou "live" - requiert KYC approuve)
curl -X POST ${BASE}/v1/merchant/mode \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"mode": "sandbox"}'

# Creer une transaction de test
curl -X POST ${BASE}/v1/merchant/sandbox/test \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operator": "orange",
    "direction": "collect",
    "amount": 1000,
    "currency": "CDF",
    "phone": "+243890000000"
  }'`,
  node: `// Basculer en mode sandbox
await fetch('${BASE}/v1/merchant/mode', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ mode: 'sandbox' }),
});

// Transaction de test (aucun appel operateur, aucun argent reel)
const res = await fetch('${BASE}/v1/merchant/sandbox/test', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    operator: 'orange',
    direction: 'collect',
    amount: 1000,
    currency: 'CDF',
    phone: '+243890000000',
  }),
});`,
  python: `import requests

h = {'Authorization': f'Bearer {token}'}

# Basculer en mode sandbox
requests.post('${BASE}/v1/merchant/mode',
              headers=h, json={'mode': 'sandbox'})

# Transaction de test
r = requests.post('${BASE}/v1/merchant/sandbox/test', headers=h, json={
    'operator': 'orange', 'direction': 'collect',
    'amount': 1000, 'currency': 'CDF',
    'phone': '+243890000000',
})
print(r.json())`,
};

const balanceCode: CodeEx = {
  shell: `curl "${BASE}/v1/merchant/balance?currency=CDF" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
  node: `const res = await fetch(
  '${BASE}/v1/merchant/balance?currency=CDF',
  { headers: { 'Authorization': 'Bearer ' + token } }
);
const data = await res.json();`,
  python: `import requests

r = requests.get(
    '${BASE}/v1/merchant/balance',
    headers={'Authorization': f'Bearer {token}'},
    params={'currency': 'CDF'}
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
  '${BASE}/v1/merchant/transactions?' + params,
  { headers: { 'Authorization': 'Bearer ' + token } }
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
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"label": "production"}'`,
  node: `const res = await fetch('${BASE}/v1/merchant/apikey', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ label: 'production' }),
});
const { api_key } = await res.json();
// Attention : la cle en clair n'est affichee qu'une seule fois`,
  python: `import requests

r = requests.post(
    '${BASE}/v1/merchant/apikey',
    headers={'Authorization': f'Bearer {token}'},
    json={'label': 'production'}
)
data = r.json()
# Attention : la cle en clair n'est affichee qu'une seule fois
print(data['api_key'])`,
};

const settlementCode: CodeEx = {
  shell: `# Definir le numero Mobile Money de reglement
curl -X POST ${BASE}/v1/merchant/settlement/phone \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+243810000000"}'

# Demander un reglement (amount omis = solde complet)
curl -X POST ${BASE}/v1/merchant/settlement/request \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 50000, "currency": "CDF"}'`,
  node: `// Definir le numero de reglement (une seule fois)
await fetch('${BASE}/v1/merchant/settlement/phone', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ phone: '+243810000000' }),
});

// Demander un reglement - sans amount = solde complet
const res = await fetch('${BASE}/v1/merchant/settlement/request', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ amount: 50000, currency: 'CDF' }),
});`,
  python: `import requests

h = {'Authorization': f'Bearer {token}'}

# Numero de reglement (une seule fois)
requests.post('${BASE}/v1/merchant/settlement/phone',
              headers=h, json={'phone': '+243810000000'})

# Demande de reglement - sans 'amount' = solde complet
r = requests.post('${BASE}/v1/merchant/settlement/request',
                  headers=h,
                  json={'amount': 50000, 'currency': 'CDF'})
print(r.json())`,
};

const authCode: CodeEx = {
  shell: `# API Key (routes /v1/payment/*)
curl ${BASE}/v1/payment/initiate \\
  -H "X-API-Key: upk_live_xxxxxxxx" \\
  ...

# JWT Bearer (routes /v1/merchant/*)
curl ${BASE}/v1/merchant/balance \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
  node: `// API Key - routes /v1/payment/*
const headers = { 'X-API-Key': 'upk_live_xxxxxxxx' };

// JWT Bearer - routes /v1/merchant/*
const bearerHeaders = {
  'Authorization': 'Bearer ' + jwtToken,
};`,
  python: `# API Key - routes /v1/payment/*
headers = {'X-API-Key': 'upk_live_xxxxxxxx'}

# JWT Bearer - routes /v1/merchant/*
bearer_headers = {
    'Authorization': f'Bearer {jwt_token}'
}`,
};

/* ── params tables ──────────────────────────────────────────── */
const paymentParams: Param[] = [
  { field: 'operator',  type: 'string',  req: true,  desc: 'orange | airtel | afrimoney' },
  { field: 'direction', type: 'string',  req: true,  desc: '"collect" ou "payout"' },
  { field: 'amount',    type: 'number',  req: true,  desc: 'Montant (minimum 1) dans la devise indiquée par currency' },
  { field: 'currency',  type: 'string',  req: true,  desc: '"CDF" | "USD" - devise du paiement Mobile Money' },
  { field: 'phone',     type: 'string',  req: true,  desc: 'Numéro mobile : +243XXXXXXXXX (E.164, recommandé), 0XXXXXXXXX ou XXXXXXXXX' },
  { field: 'reference', type: 'string',  req: false, desc: 'Référence interne de votre système (max 128 car.) - voir idempotence' },
  { field: 'metadata',  type: 'object',  req: false, desc: 'Objet libre, stocké avec la transaction et renvoyé dans l\'historique' },
];
const historyParams: Param[] = [
  { field: 'page',     type: 'number', req: false, desc: 'Page (défaut: 1)' },
  { field: 'limit',    type: 'number', req: false, desc: 'Par page, max 100 (défaut: 20)' },
  { field: 'operator', type: 'string', req: false, desc: 'orange | airtel | afrimoney' },
  { field: 'status',   type: 'string', req: false, desc: 'pending | processing | success | failed | cancelled' },
  { field: 'direction',type: 'string', req: false, desc: 'collect | payout' },
  { field: 'currency', type: 'string', req: false, desc: 'CDF | USD' },
];
const settlementRequestParams: Param[] = [
  { field: 'amount',   type: 'number', req: false, desc: 'Montant à verser. Omis ou 0 = solde complet de la devise' },
  { field: 'currency', type: 'string', req: false, desc: '"CDF" | "USD" (défaut: CDF)' },
];

/* ── response examples ──────────────────────────────────────── */
const LOGIN_RESPONSE = `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "merchant_id": "4f2a91be-7c3d-4e5f-9a0b-1d2e3f4a5b6c",
  "name": "Ma Boutique",
  "email": "vous@exemple.com"
}`;

const PAYMENT_RESPONSE = `// HTTP 201
{
  "transaction_id": "${TXID}",
  "status": "processing",
  "amount": 5000,
  "fee": 250,
  "net_amount": 4750,
  "currency": "CDF"
}

// Mode sandbox : "status": "success" + "sandbox": true
// Replay idempotent : "idempotent": true en plus`;

const STATUS_RESPONSE = `{
  "transaction_id": "${TXID}",
  "status": "success",
  "operator": "orange",
  "direction": "collect",
  "amount": 5000,
  "fee": 250,
  "net_amount": 4750,
  "currency": "CDF",
  "phone": "+243890000000",
  "reference": "ORDER-001",
  "created_at": "2026-06-04T20:00:00.000Z",
  "updated_at": "2026-06-04T20:02:31.000Z"
}`;

const WEBHOOK_PAYLOAD = `// POST https://votre-domaine.com/webhooks/unipay
// X-UniPay-Signature: sha256=<hmac_hex>
{
  "event": "payment.status_update",
  "timestamp": "2026-06-04T20:02:31.000Z",
  "data": {
    "transaction_id": "${TXID}",
    "reference": "ORDER-001",
    "status": "success"
  }
}
// En cas d'echec, data contient aussi :
// "provider_result": { "code": "...", "message": "..." }`;

const WEBHOOK_CONFIG_RESPONSE = `{
  "webhook_url": "https://votre-domaine.com/webhooks/unipay",
  "webhook_secret": "whsec_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c",
  "note": "Save this secret now — it will not be shown again."
}`;

const SANDBOX_RESPONSE = `// HTTP 201 - aucun appel operateur, aucun argent reel
{
  "transaction_id": "${TXID}",
  "status": "success",
  "amount": 1000,
  "fee": 50,
  "net_amount": 950,
  "currency": "CDF",
  "sandbox": true,
  "operator": "orange",
  "direction": "collect"
}`;

const BALANCE_RESPONSE = `{
  "balance": 245000,
  "currency": "CDF",
  "mode": "live"
}`;

const HISTORY_RESPONSE = `{
  "data": [
    {
      "id": "${TXID}",
      "operator": "orange",
      "direction": "collect",
      "amount": 5000,
      "fee": 250,
      "net_amount": 4750,
      "currency": "CDF",
      "phone": "+243890000000",
      "reference": "ORDER-001",
      "status": "success",
      "created_at": "2026-06-04T20:00:00.000Z",
      "updated_at": "2026-06-04T20:02:31.000Z",
      "metadata": {}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "pages": 8
  }
}`;

const APIKEY_RESPONSE = `// HTTP 201
{
  "api_key": "upk_live_a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
  "key_prefix": "upk_live_a3f",
  "label": "production",
  "note": "Store this key securely — it will not be shown again."
}`;

const SETTLEMENT_BALANCE_RESPONSE = `{
  "balance": 245000,
  "balances": [
    { "currency": "CDF", "balance": 245000, "total_credits": 300000, "total_settlements": 55000 },
    { "currency": "USD", "balance": 0, "total_credits": 0, "total_settlements": 0 }
  ],
  "settlement_phone": "+243810000000",
  "kyc_status": "approved",
  "mode": "live"
}`;

const SETTLEMENT_REQUEST_RESPONSE = `// HTTP 201 - paiement automatique
{
  "request_id": "1c8d4e2f-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
  "status": "processing",
  "amount": 50000,
  "currency": "CDF",
  "provider_ref": "REF-55667788",
  "balance_after": 195000,
  "auto_payout": true
}

// Au-dela des seuils automatiques :
// { "status": "pending_admin_review", "auto_payout": false, ... }`;

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
    { id: 'webhooks',     label: t('s_webhooks') },
    { id: 'sandbox',      label: t('s_sandbox') },
    { id: 'balance',      label: t('s_balance') },
    { id: 'history',      label: t('s_history') },
    { id: 'apikey',       label: t('s_apikey') },
    { id: 'settlement',   label: t('s_settlement') },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cp  = t('copy');
  const cpd = t('copied');
  const paramLabels = { field: t('param_field'), type: t('param_type'), req: t('param_required'), desc: t('param_desc'), yes: t('required'), no: t('optional') };

  const EndpointTitle = ({ id, label, method, path }: { id: string; label: string; method: string; path: string }) => (
    <div className="scroll-mt-20" id={id}>
      <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-3">{label}</h2>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        <MethodBadge m={method} />
        <code className="text-sm font-mono text-gray-300 bg-[#0d1117] border border-gray-700/60 px-3 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
          {BASE}{path}
        </code>
        <CopyButton text={`${BASE}${path}`} label={cp} labelDone={cpd} />
      </div>
    </div>
  );

  const SubTitle = ({ method, path }: { method: string; path: string }) => (
    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-0.5 px-0.5">
      <MethodBadge m={method} />
      <code className="text-xs font-mono text-gray-300 bg-[#0d1117] border border-gray-700/60 px-2.5 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
        {path}
      </code>
      <CopyButton text={`${BASE}${path}`} label={cp} labelDone={cpd} />
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-[#E8EBF0] dark:bg-navy pt-16">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-14 lg:py-20 border-b border-gray-200 dark:border-text-secondary/15">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-navy dark:via-navy/80 dark:to-navy" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-deep/6 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-deep/10 border border-green-deep/25 text-green-deep text-xs font-semibold mb-5">
              <Code2 size={13} /> {t('badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 dark:text-text-primary leading-[1.1] tracking-tight mb-4">
              {t('title')}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-text-secondary max-w-2xl leading-relaxed mb-6">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-navy-panel text-gray-700 dark:text-text-primary text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-green-deep animate-pulse" />
                {BASE}
              </div>
              <a href={`/${locale}/status`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-text-secondary hover:text-green-deep transition-colors">
                <ExternalLink size={12} /> API Status
              </a>
            </div>
          </div>
        </section>

        {/* ── Mobile section nav ────────────────────────────────── */}
        <div className="lg:hidden sticky top-16 z-30 bg-white dark:bg-navy border-b border-gray-200 dark:border-text-secondary/15 px-4 py-2">
          <select
            onChange={e => scrollTo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy/60 text-sm text-gray-700 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/50"
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
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-text-secondary/70 mb-3 px-2">{t('on_this_page')}</p>
                <nav className="space-y-0.5">
                  {NAV.map(({ id, label }) => (
                    <button key={id} onClick={() => scrollTo(id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                        active === id
                          ? 'bg-green-deep/10 text-green-deep dark:bg-green-deep/15 font-medium'
                          : 'text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel hover:text-gray-900 dark:hover:text-gray-200'
                      }`}>
                      {active === id && <span className="w-1 h-1 rounded-full bg-green-deep flex-shrink-0" />}
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
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_base_url')}</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr ? 'Toutes les requêtes doivent pointer vers le serveur de production suivant. L\'API utilise HTTPS exclusivement.' : 'All requests must target the following production server. The API uses HTTPS exclusively.'}
                    </p>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-navy/60 border border-gray-200 dark:border-text-secondary/15">
                      <ShieldCheck size={16} className="text-green-deep flex-shrink-0" />
                      <code className="text-sm font-mono text-gray-800 dark:text-text-primary flex-1 break-all">{BASE}</code>
                      <CopyButton text={BASE} label={cp} labelDone={cpd} />
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-700/60 bg-[#0d1117]">
                    <div className="px-4 py-2 bg-[#161b22] border-b border-gray-700/60 text-xs font-mono text-gray-500">Base URL</div>
                    <pre className="p-4 text-[13px] font-mono text-gray-300 leading-relaxed overflow-x-auto">{`# Production
${BASE}

# All endpoints are prefixed with /v1
${BASE}/v1/payment/initiate
${BASE}/v1/merchant/balance`}</pre>
                  </div>
                </div>
              </section>

              {/* AUTHENTICATION */}
              <section id="auth" className="scroll-mt-20">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_auth')}</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr ? "L'API supporte deux méthodes d'authentification :" : 'The API supports two authentication methods:'}
                    </p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-text-secondary/15 bg-gray-50/50 dark:bg-navy/60">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">X-API-Key</span>
                          <span className="text-xs text-gray-500">{isFr ? 'Routes /v1/payment/* (paiements)' : '/v1/payment/* routes (payments)'}</span>
                        </div>
                        <code className="text-xs font-mono text-gray-600 dark:text-text-secondary">X-API-Key: upk_live_xxxxxxxx</code>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-text-secondary/15 bg-gray-50/50 dark:bg-navy/60">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40">Bearer</span>
                          <span className="text-xs text-gray-500">{isFr ? 'Routes /v1/merchant/* (compte marchand)' : '/v1/merchant/* routes (merchant account)'}</span>
                        </div>
                        <code className="text-xs font-mono text-gray-600 dark:text-text-secondary">Authorization: Bearer &lt;jwt&gt;</code>
                      </div>
                    </div>
                    <div className="pt-2">
                      <SubTitle method="POST" path="/v1/merchant/login" />
                      <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                        {isFr
                          ? 'Le JWT s\'obtient via POST /v1/merchant/login avec vos identifiants du tableau de bord (email + mot de passe). Le token retourné (access_token) est valable 24 h (expires_in: 86400). Limite : 10 tentatives/min.'
                          : 'The JWT is obtained via POST /v1/merchant/login with your dashboard credentials (email + password). The returned access_token is valid for 24 h (expires_in: 86400). Rate limit: 10 attempts/min.'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={loginCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={LOGIN_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                    <CodeBlock ex={authCode} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* COLLECT */}
              <section id="collect" className="scroll-mt-20">
                <EndpointTitle id="collect" label={t('s_collect')} method="POST" path="/v1/payment/initiate" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr ? 'Initie une demande de paiement (débit) depuis un abonné Mobile Money vers votre compte marchand. Réponse en HTTP 201 avec status "processing".' : 'Initiates a payment request (debit) from a Mobile Money subscriber to your merchant account. Returns HTTP 201 with status "processing".'}
                    </p>
                    <ParamTable params={paymentParams.map(p => ({ ...p, desc: isFr ? p.desc : ({
                      'operator': 'orange | airtel | afrimoney',
                      'direction': '"collect" or "payout"',
                      'amount': 'Amount (minimum 1) in the currency set by currency',
                      'currency': '"CDF" | "USD" - Mobile Money payment currency',
                      'phone': 'Mobile number: +243XXXXXXXXX (E.164, recommended), 0XXXXXXXXX or XXXXXXXXX',
                      'reference': 'Your internal reference (max 128 chars) - see idempotency',
                      'metadata': 'Free-form object, stored with the transaction and returned in history',
                    } as Record<string, string>)[p.field] ?? p.desc }))} labels={paramLabels} />
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      {isFr
                        ? <>Idempotence : si vous renvoyez une requête avec une <code className="font-mono">reference</code> déjà utilisée, une transaction encore en cours (pending/processing) est retournée telle quelle avec <code className="font-mono">idempotent: true</code>. Si la transaction est terminée, l&apos;API répond 409 DUPLICATE_REFERENCE. Vous pouvez donc retenter en toute sécurité après un timeout réseau.</>
                        : <>Idempotency: if you resend a request with an already-used <code className="font-mono">reference</code>, an in-flight transaction (pending/processing) is returned as-is with <code className="font-mono">idempotent: true</code>. If the transaction is final, the API returns 409 DUPLICATE_REFERENCE. Retrying after a network timeout is therefore safe.</>}
                    </div>
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
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr ? 'Envoie un paiement (crédit) depuis votre compte marchand vers un abonné Mobile Money. Même endpoint que Collect, avec direction: "payout".' : 'Sends a payment (credit) from your merchant account to a Mobile Money subscriber. Same endpoint as Collect, with direction: "payout".'}
                    </p>
                    <ParamTable params={paymentParams.map(p => ({ ...p, desc: isFr ? p.desc : ({
                      'operator': 'orange | airtel | afrimoney',
                      'direction': '"collect" or "payout"',
                      'amount': 'Amount (minimum 1) in the currency set by currency',
                      'currency': '"CDF" | "USD" - Mobile Money payment currency',
                      'phone': 'Mobile number: +243XXXXXXXXX (E.164, recommended), 0XXXXXXXXX or XXXXXXXXX',
                      'reference': 'Your internal reference (max 128 chars) - see idempotency',
                      'metadata': 'Free-form object, stored with the transaction and returned in history',
                    } as Record<string, string>)[p.field] ?? p.desc }))} labels={paramLabels} />
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      {isFr
                        ? 'Pré-requis payout : compte en mode live, KYC approuvé, et solde marchand suffisant dans la devise demandée. L\'API vérifie aussi que le numéro appartient bien à l\'opérateur choisi (sinon 400 OPERATOR_PHONE_MISMATCH).'
                        : 'Payout prerequisites: account in live mode, approved KYC, and sufficient merchant balance in the requested currency. The API also checks that the phone number belongs to the selected operator (otherwise 400 OPERATOR_PHONE_MISMATCH).'}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={payoutCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={PAYMENT_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* TRANSACTION STATUS */}
              <section id="tx-status" className="scroll-mt-20">
                <EndpointTitle id="tx-status" label={t('s_status')} method="GET" path="/v1/payment/:id/status" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr ? 'Retourne le statut actuel d\'une transaction. Utile pour le polling si vous n\'utilisez pas les webhooks.' : 'Returns the current status of a transaction. Useful for polling if you do not use webhooks.'}
                    </p>
                    <ParamTable params={[{ field: ':id', type: 'string', req: true, desc: isFr ? 'transaction_id (UUID v4) retourné à l\'initiation' : 'transaction_id (UUID v4) returned at initiation' }]} labels={paramLabels} />
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'success', 'failed', 'cancelled'].map(s => (
                        <span key={s} className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                          s === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                          s === 'failed' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                          'bg-gray-100 dark:bg-navy-panel text-gray-600 dark:text-text-secondary border-gray-200 dark:border-text-secondary/20'}`}>{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-text-secondary leading-relaxed">
                      {isFr
                        ? 'Note : les transactions encore en cours de traitement chez l\'opérateur sont renvoyées avec status "pending" (la valeur interne "processing" n\'est jamais exposée par cet endpoint).'
                        : 'Note: transactions still being processed by the operator are returned with status "pending" (the internal "processing" value is never exposed by this endpoint).'}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={statusCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={STATUS_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* WEBHOOKS */}
              <section id="webhooks" className="scroll-mt-20">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_webhooks')}</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr
                        ? 'Plutôt que de poller /payment/:id/status, configurez une URL HTTPS : UniPay y envoie un POST payment.status_update à chaque changement de statut. Chaque requête est signée en HMAC-SHA256 via le header X-UniPay-Signature, avec le webhook_secret retourné à la configuration (format whsec_...).'
                        : 'Instead of polling /payment/:id/status, configure an HTTPS URL: UniPay POSTs a payment.status_update event on every status change. Each request is signed with HMAC-SHA256 in the X-UniPay-Signature header, using the webhook_secret returned at configuration time (whsec_... format).'}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <SubTitle method="POST" path="/v1/merchant/webhook" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Configure l\'URL (HTTPS obligatoire, adresses privées/loopback refusées) et retourne le secret. GET /v1/merchant/webhook retourne { configured, webhook_url, has_secret }.' : 'Sets the URL (HTTPS required, private/loopback addresses rejected) and returns the secret. GET /v1/merchant/webhook returns { configured, webhook_url, has_secret }.'}</p>
                      </div>
                      <div>
                        <SubTitle method="POST" path="/v1/merchant/webhook/test" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Envoie un événement webhook.test signé vers votre URL. Réponse : { ok, status_code, duration_ms }. Limité à 5 tests/heure.' : 'Sends a signed webhook.test event to your URL. Response: { ok, status_code, duration_ms }. Limited to 5 tests/hour.'}</p>
                      </div>
                      <div>
                        <SubTitle method="DELETE" path="/v1/merchant/webhook" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Supprime l\'URL et le secret. Réponse : { ok: true }.' : 'Removes the URL and secret. Response: { ok: true }.'}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-400">
                      {isFr ? 'Le webhook_secret n\'est affiché qu\'une fois, à la configuration. Sauvegardez-le immédiatement : il permet de vérifier que les événements viennent bien de UniPay.' : 'The webhook_secret is shown only once, at configuration time. Save it immediately: it lets you verify that events genuinely come from UniPay.'}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={webhookConfigCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={WEBHOOK_CONFIG_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={WEBHOOK_PAYLOAD} label={isFr ? 'Payload événement' : 'Event payload'} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
                <div className="mt-6 grid lg:grid-cols-2 gap-6">
                  <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                    {isFr
                      ? 'Vérification de signature : calculez HMAC-SHA256 du body brut avec votre secret, préfixez de "sha256=" et comparez au header X-UniPay-Signature en temps constant. Vérifiez toujours la signature avant de traiter l\'événement.'
                      : 'Signature verification: compute HMAC-SHA256 of the raw body with your secret, prefix with "sha256=" and compare to the X-UniPay-Signature header in constant time. Always verify the signature before processing the event.'}
                  </p>
                  <CodeBlock ex={webhookVerifyCode} copyLabel={cp} copiedLabel={cpd} />
                </div>
              </section>

              {/* SANDBOX */}
              <section id="sandbox" className="scroll-mt-20">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_sandbox')}</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr
                        ? 'Votre compte démarre en mode sandbox : les transactions sont simulées (status "success" immédiat, sandbox: true dans la réponse, aucun appel opérateur, aucun argent réel). Les frais appliquent le même taux qu\'en live (5% par défaut), ce que vous voyez en test correspond à la production. Le passage en mode live requiert un KYC approuvé.'
                        : 'Your account starts in sandbox mode: transactions are simulated (immediate "success" status, sandbox: true in the response, no operator call, no real money). Fees apply the same rate as live (5% by default), so what you see in tests matches production. Switching to live mode requires an approved KYC.'}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <SubTitle method="GET" path="/v1/merchant/mode" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Retourne { mode, kyc_status }.' : 'Returns { mode, kyc_status }.'}</p>
                      </div>
                      <div>
                        <SubTitle method="POST" path="/v1/merchant/mode" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Body { mode: "sandbox" | "live" }. Retourne { mode, ok: true }. Le mode live exige kyc_status = "approved" (sinon 403).' : 'Body { mode: "sandbox" | "live" }. Returns { mode, ok: true }. Live mode requires kyc_status = "approved" (otherwise 403).'}</p>
                      </div>
                      <div>
                        <SubTitle method="POST" path="/v1/merchant/sandbox/test" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Crée une transaction de test marquée sandbox (champs : operator, direction, amount, currency, phone).' : 'Creates a test transaction flagged as sandbox (fields: operator, direction, amount, currency, phone).'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={sandboxCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={SANDBOX_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* BALANCE */}
              <section id="balance" className="scroll-mt-20">
                <EndpointTitle id="balance" label={t('s_balance')} method="GET" path="/v1/merchant/balance" />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr ? 'Retourne le solde de votre compte marchand pour une devise donnée (paramètre currency, CDF par défaut). Une seule devise est retournée par appel. Requiert un Bearer JWT obtenu via /v1/merchant/login.' : 'Returns your merchant account balance for a given currency (currency parameter, defaults to CDF). A single currency is returned per call. Requires a Bearer JWT obtained via /v1/merchant/login.'}
                    </p>
                    <ParamTable params={[{ field: 'currency', type: 'string', req: false, desc: isFr ? '"CDF" | "USD" (défaut: CDF)' : '"CDF" | "USD" (default: CDF)' }]} labels={paramLabels} />
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400">
                      {isFr ? 'Authentification JWT requise (Authorization: Bearer)' : 'JWT authentication required (Authorization: Bearer)'}
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
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr ? 'Retourne l\'historique paginé des transactions (les plus récentes d\'abord) avec filtres optionnels. La pagination est encapsulée dans l\'objet pagination.' : 'Returns the paginated transaction history (most recent first) with optional filters. Pagination is wrapped in the pagination object.'}
                    </p>
                    <ParamTable params={historyParams.map(p => ({ ...p, desc: isFr ? p.desc : ({
                      'page': 'Page (default: 1)',
                      'limit': 'Per page, max 100 (default: 20)',
                      'operator': 'orange | airtel | afrimoney',
                      'status': 'pending | processing | success | failed | cancelled',
                      'direction': 'collect | payout',
                      'currency': 'CDF | USD',
                    } as Record<string, string>)[p.field] ?? p.desc }))} labels={paramLabels} />
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
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr
                        ? 'Génère une nouvelle clé API au format upk_live_<48 hex>. Les clés existantes portant le même label (défaut : "default") sont désactivées ; les clés de labels différents restent actives, ce qui permet des rotations sans interruption.'
                        : 'Generates a new API key in the upk_live_<48 hex> format. Existing keys with the same label (default: "default") are deactivated; keys with different labels stay active, allowing zero-downtime rotations.'}
                    </p>
                    <ParamTable params={[{ field: 'label', type: 'string', req: false, desc: isFr ? 'Nom de la clé (max 64 car., défaut: "default")' : 'Key name (max 64 chars, default: "default")' }]} labels={paramLabels} />
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-400">
                      {isFr ? 'Sauvegardez immédiatement la clé retournée. Elle ne sera plus affichée : seul le préfixe (key_prefix) reste visible ensuite.' : 'Save the returned key immediately. It will not be shown again: only the key_prefix remains visible afterwards.'}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={apikeyCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={APIKEY_RESPONSE} label={t('response')} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* SETTLEMENT */}
              <section id="settlement" className="scroll-mt-20">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_settlement')}</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                      {isFr
                        ? 'Le règlement (settlement) verse votre solde marchand sur votre numéro Mobile Money. Pré-requis : KYC approuvé, compte en mode live, et un numéro de règlement configuré.'
                        : 'Settlement pays out your merchant balance to your Mobile Money number. Prerequisites: approved KYC, live mode, and a configured settlement phone.'}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <SubTitle method="GET" path="/v1/merchant/settlement/balance" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Solde détaillé par devise (balances[]), numéro configuré et statut KYC.' : 'Per-currency balance breakdown (balances[]), configured phone and KYC status.'}</p>
                      </div>
                      <div>
                        <SubTitle method="POST" path="/v1/merchant/settlement/phone" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Body { phone }. Définit le numéro de règlement (format DRC validé). Retourne { ok, settlement_phone }.' : 'Body { phone }. Sets the settlement number (DRC format validated). Returns { ok, settlement_phone }.'}</p>
                      </div>
                      <div>
                        <SubTitle method="POST" path="/v1/merchant/settlement/request" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Crée la demande. Sous les seuils automatiques, le versement part immédiatement (auto_payout: true) ; au-delà, la demande passe en revue admin (pending_admin_review).' : 'Creates the request. Below the automatic thresholds the payout fires immediately (auto_payout: true); above, the request goes to admin review (pending_admin_review).'}</p>
                      </div>
                      <div>
                        <SubTitle method="GET" path="/v1/merchant/settlement/history" />
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{isFr ? 'Historique paginé : ?page= &limit= (max 100). Réponse { requests, total, page, limit }.' : 'Paginated history: ?page= &limit= (max 100). Response { requests, total, page, limit }.'}</p>
                      </div>
                    </div>
                    <ParamTable params={settlementRequestParams.map(p => ({ ...p, desc: isFr ? p.desc : ({
                      'amount': 'Amount to pay out. Omitted or 0 = full balance of the currency',
                      'currency': '"CDF" | "USD" (default: CDF)',
                    } as Record<string, string>)[p.field] ?? p.desc }))} labels={paramLabels} />
                    <p className="text-xs text-gray-500 dark:text-text-secondary leading-relaxed">
                      {isFr
                        ? 'Erreurs propres au settlement : 403 KYC_REQUIRED, 403 LIVE_MODE_REQUIRED, 400 SETTLEMENT_PHONE_REQUIRED, 400 INVALID_SETTLEMENT_PHONE, 400 OPERATOR_UNDETECTABLE, 402 INSUFFICIENT_BALANCE, 502 PAYOUT_FAILED.'
                        : 'Settlement-specific errors: 403 KYC_REQUIRED, 403 LIVE_MODE_REQUIRED, 400 SETTLEMENT_PHONE_REQUIRED, 400 INVALID_SETTLEMENT_PHONE, 400 OPERATOR_UNDETECTABLE, 402 INSUFFICIENT_BALANCE, 502 PAYOUT_FAILED.'}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <CodeBlock ex={settlementCode} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={SETTLEMENT_BALANCE_RESPONSE} label={isFr ? 'Réponse balance' : 'Balance response'} copyLabel={cp} copiedLabel={cpd} />
                    <ResponseBlock json={SETTLEMENT_REQUEST_RESPONSE} label={isFr ? 'Réponse request' : 'Request response'} copyLabel={cp} copiedLabel={cpd} />
                  </div>
                </div>
              </section>

              {/* OPERATORS */}
              <section id="operators" className="scroll-mt-20">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_operators')}</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-text-secondary/15 text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-navy/60 border-b border-gray-200 dark:border-text-secondary/15">
                        {['Code', isFr ? 'Opérateur' : 'Operator', isFr ? 'Pays' : 'Country', isFr ? 'Statut' : 'Status', isFr ? 'Devises' : 'Currencies'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-text-secondary">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {OPERATORS.map((op, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-text-secondary/15 last:border-0 hover:bg-gray-50/50 dark:hover:bg-navy-panel/20 transition-colors">
                          <td className="px-5 py-3.5"><code className="text-xs font-mono font-bold text-green-deep">{op.code}</code></td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-800 dark:text-text-primary">{op.name}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-text-secondary">RDC</td>
                          <td className="px-5 py-3.5 text-sm">
                            <a href={`/${locale}/status`} className="text-xs text-gray-500 dark:text-text-secondary hover:text-green-deep transition-colors inline-flex items-center gap-1">
                              <ExternalLink size={11} /> {isFr ? 'Statut temps réel' : 'Live status'}
                            </a>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-text-secondary font-mono text-xs">CDF · USD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-text-secondary">
                  {isFr
                    ? 'Le statut en temps réel de chaque opérateur est aussi disponible via GET api.unipaycongo.com/status/operators (endpoint public, sans authentification).'
                    : 'Real-time status for each operator is also available via GET api.unipaycongo.com/status/operators (public endpoint, no authentication).'}
                </p>
              </section>

              {/* ERROR CODES */}
              <section id="errors" className="scroll-mt-20">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_errors')}</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-text-secondary/15 text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-navy/60 border-b border-gray-200 dark:border-text-secondary/15">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-text-secondary w-48">Code HTTP</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-text-secondary">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ERRORS.map((e, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-text-secondary/15 last:border-0 hover:bg-gray-50/50 dark:hover:bg-navy-panel/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border whitespace-nowrap ${
                              e.code.startsWith('4') ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40' :
                              'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40'
                            }`}>{e.code}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-text-secondary">{isFr ? e.desc : e.descEn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* FEES */}
              <section id="fees" className="scroll-mt-20">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">{t('s_fees')}</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: isFr ? 'Commission' : 'Fee', value: '5%', sub: isFr ? 'par transaction (taux par défaut)' : 'per transaction (default rate)' },
                    { label: isFr ? 'Devises' : 'Currencies', value: 'CDF · USD', sub: isFr ? 'Franc Congolais, Dollar US' : 'Congolese Franc, US Dollar' },
                    { label: 'Settlement', value: isFr ? 'À la demande' : 'On demand', sub: isFr ? 'voir section Règlement' : 'see Settlement section' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="p-5 rounded-2xl border border-gray-200 dark:border-text-secondary/15 bg-gray-50/50 dark:bg-navy/60 text-center">
                      <div className="text-2xl sm:text-3xl font-serif font-bold text-green-deep mb-1">{value}</div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-text-primary mb-0.5">{label}</div>
                      <div className="text-xs text-gray-500 dark:text-text-secondary">{sub}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-gray-500 dark:text-text-secondary leading-relaxed">
                  {isFr
                    ? 'Le taux de commission par défaut est de 5% sur chaque transaction (collect et payout), dans les deux devises (CDF et USD). Ce taux est configurable côté serveur et peut évoluer : le net_amount retourné dans chaque réponse reflète toujours les frais réellement appliqués. Les soldes marchands sont suivis séparément par devise, jamais mélangés.'
                    : 'The default commission rate is 5% on each transaction (collect and payout), in both currencies (CDF and USD). This rate is configurable server-side and may change: the net_amount returned in each response always reflects the fees actually applied. Merchant balances are tracked separately per currency, never mixed.'}
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
