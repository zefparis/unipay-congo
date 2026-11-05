import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signedClientIpHeaders } from '@/lib/bff-client-ip';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

// Toujours renvoyer du JSON au navigateur, même si l'API répond autre chose
// (HTML d'erreur, corps vide...), sinon le front plante sur res.json().
async function forwardJson(upstream: Response) {
  const data = await upstream.json().catch(() => ({})) as { error?: string };
  if (!upstream.ok && !data.error) {
    data.error = upstream.status === 413
      ? 'Fichiers trop lourds (10 Mo maximum par fichier).'
      : 'Réponse du serveur illisible, réessayez.';
  }
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const upstream = await fetch(`${API_URL}/v1/merchant/kyc`, {
      headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}` },
    });
    return await forwardJson(upstream);
  } catch {
    return NextResponse.json({ error: 'Service indisponible, réessayez.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Forward multipart/form-data unchanged so the backend can parse files.
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('multipart/form-data')) {
    try {
      const body = await request.formData();
      const upstream = await fetch(`${API_URL}/v1/merchant/kyc`, {
        method: 'POST',
        headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}`, ...signedClientIpHeaders(request) },
        body,
      });
      return await forwardJson(upstream);
    } catch {
      return NextResponse.json({ error: 'Envoi impossible, réessayez.' }, { status: 502 });
    }
  }

  // Legacy JSON path (kept for safety, but the UI now sends multipart).
  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body */ }

  try {
    const upstream = await fetch(`${API_URL}/v1/merchant/kyc`, {
      method: 'POST',
      headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...signedClientIpHeaders(request) },
      body: JSON.stringify(body),
    });
    return await forwardJson(upstream);
  } catch {
    return NextResponse.json({ error: 'Service indisponible, réessayez.' }, { status: 502 });
  }
}
