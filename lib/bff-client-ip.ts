import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Transmet l'IP réelle du client à l'API via un en-tête signé HMAC.
 * Sans ça, tous les marchands derrière le BFF partagent l'IP de sortie
 * Vercel dans le rate-limit de l'API (compteur commun).
 *
 * L'API ne fait confiance à cet en-tête QUE si la signature matche
 * BFF_IP_SECRET — un client ne peut pas le forger.
 * Secret absent → en-têtes non envoyés (repli sur req.ip côté API).
 */
export function signedClientIpHeaders(request: NextRequest): Record<string, string> {
  const secret = process.env.BFF_IP_SECRET;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.ip ||
    '';
  if (!secret || !ip) return {};
  return {
    'x-unipay-client-ip': ip,
    'x-unipay-client-sig': crypto.createHmac('sha256', secret).update(ip).digest('hex'),
  };
}
