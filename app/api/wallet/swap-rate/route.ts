import { NextRequest, NextResponse } from 'next/server';
import { signedClientIpHeaders } from '@/lib/bff-client-ip';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

// Public swap rate + AMM pool reserves. Proxies the UniPay API so the admin
// dashboard can display the USDT reserve without exposing the upstream host.
export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(`${API_URL}/v1/wallet/swap/rate`, { cache: 'no-store', headers: signedClientIpHeaders(request) });
    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({ error: data.error ?? 'Swap service unavailable' }, { status: upstream.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Swap service unreachable' }, { status: 503 });
  }
}
