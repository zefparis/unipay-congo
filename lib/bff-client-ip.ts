import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Transmet l'IP réelle du client à l'API via un en-tête signé HMAC.
 * Sans ça, tous les marchands derrière le BFF partagent le compteur
 * rate-limit de l'IP de sortie Vercel (compteur commun).
 *
 * L'API ne fait confiance à cet en-tête QUE si la signature matche
 * BFF_IP_SECRET — un client ne peut pas le forger.
 * Secret absent → en-têtes non envoyés (repli sur req.ip côté API).
 *
 * Chaîne : navigateur → Cloudflare → Vercel → API.
 * - cf-connecting-ip : IP réelle du client, posée/écrasée par
 *   Cloudflare — non forgeable tant que la requête passe par CF.
 *   Exception : un accès direct au domaine *.vercel.app contourne CF
 *   → cf-connecting-ip serait forgeable → on prend alors x-real-ip.
 * - x-real-ip : peer TCP vu par Vercel (IP Cloudflare en prod, ou
 *   l'IP réelle si accès direct *.vercel.app) — toujours fiable.
 * - jamais x-forwarded-for : forgé par le client.
 */
export function signedClientIpHeaders(request: NextRequest): Record<string, string> {
  const secret = process.env.BFF_IP_SECRET;
  if (!secret) return {};

  const host = request.headers.get('host') ?? '';
  const directVercel = host.endsWith('.vercel.app');
  const ip =
    (directVercel ? null : request.headers.get('cf-connecting-ip')) ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    '';
  if (!ip) return {};

  return {
    'x-unipay-client-ip': ip,
    'x-unipay-client-sig': crypto.createHmac('sha256', secret).update(ip).digest('hex'),
  };
}
