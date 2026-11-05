import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

// Émet une URL signée d'upload direct navigateur → Supabase Storage.
// Le fichier ne transite ni par Vercel ni par le serveur API.
export async function POST(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_URL}/v1/merchant/kyc/upload-url`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await upstream.json().catch(() => ({})) as { error?: string };
    if (!upstream.ok) {
      return NextResponse.json({ error: data.error ?? 'Envoi impossible, réessayez.' }, { status: upstream.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Service indisponible, réessayez.' }, { status: 502 });
  }
}
