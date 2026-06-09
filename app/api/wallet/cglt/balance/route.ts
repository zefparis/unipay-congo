import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/v1/wallet/balance`, {
    headers: { Authorization: `Bearer ${walletToken}` },
    cache: 'no-store',
  });

  const data = await upstream.json() as { cglt_balance?: number };

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: upstream.status });
  }

  return NextResponse.json({ cglt_balance: Number(data.cglt_balance ?? 0) });
}
