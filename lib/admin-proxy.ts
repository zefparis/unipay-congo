import { NextResponse } from 'next/server';

// NEXT_PUBLIC_API_URL is only a transitional fallback — it must be replaced
// by the server-only API_URL env var in a future task.
function getApiUrl(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'https://unipay-api.onrender.com'
  );
}

function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? '';
}

const DEFAULT_TIMEOUT_MS = 30_000;

export type AdminProxyOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown | FormData;
  headers?: HeadersInit;
  timeoutMs?: number;
  responseType?: 'json' | 'text';
  extraQueryParams?: string;
};

function notConfigured(): NextResponse {
  return NextResponse.json(
    { error: 'Admin service unavailable', code: 'ADMIN_NOT_CONFIGURED' },
    { status: 503 },
  );
}

function timeoutResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Upstream timeout', code: 'ADMIN_UPSTREAM_TIMEOUT' },
    { status: 504 },
  );
}

function unavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Admin backend unavailable', code: 'ADMIN_UPSTREAM_UNAVAILABLE' },
    { status: 502 },
  );
}

function upstreamErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Upstream request failed', code: 'ADMIN_UPSTREAM_ERROR' },
    { status: 502 },
  );
}

export async function adminProxyFetch(
  backendPath: string,
  options: AdminProxyOptions = {},
): Promise<NextResponse> {
  const adminSecret = getAdminSecret();
  const apiUrl = getApiUrl();

  if (!adminSecret || !apiUrl) {
    return notConfigured();
  }

  const {
    method = 'GET',
    body,
    headers: extraHeaders,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    responseType = 'json',
    extraQueryParams,
  } = options;

  const url = extraQueryParams
    ? `${apiUrl}${backendPath}${backendPath.includes('?') ? '&' : '?'}${extraQueryParams}`
    : `${apiUrl}${backendPath}`;

  const headers: Record<string, string> = {
    'x-admin-secret': adminSecret,
  };

  if (extraHeaders) {
    const h = new Headers(extraHeaders);
    h.forEach((v, k) => {
      headers[k] = v;
    });
  }

  let fetchBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      fetchBody = body;
    } else {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      fetchBody = JSON.stringify(body);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: fetchBody,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return timeoutResponse();
    }
    return unavailableResponse();
  } finally {
    clearTimeout(timer);
  }

  if (responseType === 'text') {
    const text = await response.text();
    const responseHeaders = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      responseHeaders.set('Content-Disposition', contentDisposition);
    }
    return new NextResponse(text, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return upstreamErrorResponse();
    }
    return NextResponse.json(data, { status: response.status });
  }

  const text = await response.text().catch(() => '');

  if (text.length === 0) {
    return new NextResponse(null, { status: response.status });
  }

  return upstreamErrorResponse();
}
