import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/env';

function getSetCookies(res: Response): string[] {
  return typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : ([res.headers.get('set-cookie')].filter(Boolean) as string[]);
}

/** Merge new Set-Cookie name=value pairs over an existing Cookie header string. */
function mergeCookies(cookieHeader: string, setCookies: string[]): string {
  const jar = new Map<string, string>();
  for (const pair of cookieHeader.split(';')) {
    const i = pair.indexOf('=');
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
  for (const sc of setCookies) {
    const first = sc.split(';')[0] ?? '';
    const i = first.indexOf('=');
    if (i > 0) jar.set(first.slice(0, i).trim(), first.slice(i + 1).trim());
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function forward(req: NextRequest, path: string[]) {
  const target = `${serverEnv.API_INTERNAL_URL}/${path.join('/')}${req.nextUrl.search}`;
  const cookieHeader = req.headers.get('cookie') ?? '';
  const contentType = req.headers.get('content-type') ?? 'application/json';
  const bodyText =
    req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  const call = (cookie: string) =>
    fetch(target, {
      method: req.method,
      headers: { cookie, 'content-type': contentType },
      body: bodyText,
      cache: 'no-store',
    });

  let res = await call(cookieHeader);
  let refreshCookies: string[] = [];

  // Transparent token refresh: if the short-lived access token has expired but a
  // valid refresh token is present, rotate once and retry — so sessions don't
  // die ~15 min after login. Skip for /auth/* to avoid recursion.
  if (res.status === 401 && path[0] !== 'auth' && cookieHeader.includes('refresh_token')) {
    const refreshRes = await fetch(`${serverEnv.API_INTERNAL_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (refreshRes.ok) {
      refreshCookies = getSetCookies(refreshRes);
      res = await call(mergeCookies(cookieHeader, refreshCookies));
    }
  }

  const body = await res.text();
  const response = new NextResponse(body, { status: res.status });
  response.headers.set('content-type', res.headers.get('content-type') ?? 'application/json');
  // Rotated cookies first, then any from the final response.
  for (const c of [...refreshCookies, ...getSetCookies(res)]) {
    response.headers.append('set-cookie', c);
  }
  return response;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
