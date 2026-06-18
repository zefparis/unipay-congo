'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Gamepad2, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  ExternalLink, Globe, Shield, Key, Link2, Cpu,
} from 'lucide-react';
import clsx from 'clsx';

// ── Types ────────────────────────────────────────────────────────────────────

interface EndpointInfo {
  path:   string;
  status: 'ok' | 'error';
  auth:   string;
}

interface StatusResponse {
  integration_ready: boolean;
  warnings:          string[];
  config: {
    iframe_url:               string | null;
    allowed_origin:           string | null;
    provider_id:              string | null;
    jwt_issuer_configured:    boolean;
    jwt_audience_configured:  boolean;
    private_key_present:      boolean;
    private_key_valid_rsa:    boolean;
    server_secret_configured: boolean;
  };
  endpoints: {
    jwks:   EndpointInfo;
    token:  EndpointInfo;
    limits: EndpointInfo;
  };
  gaming_page_path: string;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        ok
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      )}
    >
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {label ?? (ok ? 'OK' : 'Erreur')}
    </span>
  );
}

function BoolRow({ label, value, falseLabel }: { label: string; value: boolean; falseLabel?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <StatusBadge ok={value} label={value ? 'OK' : (falseLabel ?? 'Manquant')} />
    </div>
  );
}

function ValueRow({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">{label}</span>
      {value ? (
        <span className={clsx('text-sm text-gray-900 dark:text-white text-right break-all', mono && 'font-mono')}>
          {value}
        </span>
      ) : (
        <span className="text-sm text-red-500 dark:text-red-400 italic">non configuré</span>
      )}
    </div>
  );
}

function EndpointCard({ label, ep }: { label: string; ep: EndpointInfo }) {
  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        <StatusBadge ok={ep.status === 'ok'} label={ep.status === 'ok' ? 'Opérationnel' : 'Erreur config'} />
      </div>
      <p className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">{ep.path}</p>
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Shield size={11} />
        <span>{ep.auth}</span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPredictStreetPage() {
  const [data,    setData]    = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/predictstreet/status', { cache: 'no-store' });
      if (!res.ok) {
        setErr(res.status === 401 ? 'Accès refusé — session admin requise.' : `Erreur ${res.status}`);
        return;
      }
      setData(await res.json() as StatusResponse);
    } catch {
      setErr('Impossible de contacter /api/predictstreet/status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="text-purple-500" size={22} />
            PredictStreet — Statut d&apos;intégration
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Diagnostic de la configuration du bridge Gaming
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Fetch error */}
      {err && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <XCircle size={16} />
          {err}
        </div>
      )}

      {/* Skeleton */}
      {loading && !data && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Integration-ready banner */}
          <div
            className={clsx(
              'relative overflow-hidden rounded-2xl p-5 border shadow-sm flex items-center gap-4',
              data.integration_ready
                ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/5 border-emerald-500/30 dark:border-emerald-500/20'
                : 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/30 dark:border-amber-500/20',
            )}
          >
            <div
              className={clsx(
                'p-3 rounded-xl',
                data.integration_ready ? 'bg-emerald-500/15' : 'bg-amber-500/15',
              )}
            >
              {data.integration_ready
                ? <CheckCircle2 size={22} className="text-emerald-500" />
                : <AlertTriangle size={22} className="text-amber-500" />}
            </div>
            <div>
              <p
                className={clsx(
                  'text-sm font-semibold uppercase tracking-wider mb-0.5',
                  data.integration_ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                )}
              >
                {data.integration_ready ? 'Intégration prête pour la production' : 'Configuration incomplète'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.integration_ready
                  ? 'Toutes les variables d\'environnement sont correctement configurées.'
                  : `${data.warnings.length} avertissement${data.warnings.length > 1 ? 's' : ''} détecté${data.warnings.length > 1 ? 's' : ''} — voir ci-dessous.`}
              </p>
            </div>
          </div>

          {/* Warnings */}
          {data.warnings.length > 0 && (
            <div className="bg-white dark:bg-gray-900/60 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle size={15} />
                Avertissements ({data.warnings.length})
              </h2>
              <ul className="space-y-2">
                {data.warnings.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2"
                  >
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Endpoint status cards */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Link2 size={15} className="text-purple-500" />
              Endpoints
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EndpointCard label="JWKS (public)"     ep={data.endpoints.jwks} />
              <EndpointCard label="Token SSO"         ep={data.endpoints.token} />
              <EndpointCard label="Limites utilisateur" ep={data.endpoints.limits} />
            </div>
          </div>

          {/* Config */}
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Cpu size={15} className="text-purple-500" />
              Configuration
            </h2>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Iframe / PostMessage</p>
              <ValueRow label="Iframe URL"      value={data.config.iframe_url} />
              <ValueRow label="Allowed origin"  value={data.config.allowed_origin} mono />
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Identité partenaire</p>
              <ValueRow label="Provider ID" value={data.config.provider_id} mono />
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">JWT / Clé RSA</p>
              <BoolRow label="Clé privée présente"       value={data.config.private_key_present}     falseLabel="Absente" />
              <BoolRow label="Clé privée RSA valide"     value={data.config.private_key_valid_rsa}   falseLabel="Invalide" />
              <BoolRow label="JWT Issuer configuré"      value={data.config.jwt_issuer_configured}   />
              <BoolRow label="JWT Audience configuré"    value={data.config.jwt_audience_configured} />
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Sécurité serveur-à-serveur</p>
              <BoolRow label="Server secret configuré"  value={data.config.server_secret_configured} falseLabel="Faible / absent" />
            </div>
          </div>

          {/* Security notice */}
          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-3">
            <Key size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Cette page n&apos;expose jamais la clé privée RSA, le server secret, les tokens JWT bruts ni les traces d&apos;erreur.
              Les valeurs sensibles sont masquées et uniquement accessibles aux administrateurs authentifiés.
            </p>
          </div>

          {/* Link to gaming page */}
          <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/15">
                <Globe size={18} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Page Gaming utilisateurs</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{data.gaming_page_path}</p>
              </div>
            </div>
            <a
              href="/fr/wallet/gaming"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 transition-colors"
            >
              <ExternalLink size={13} />
              Ouvrir
            </a>
          </div>
        </>
      )}
    </div>
  );
}
