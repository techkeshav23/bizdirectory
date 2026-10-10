import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/env';

async function forward(req: NextRequest, path: string[]) {
  const target = `${serverEnv.API_INTERNAL_URL}/${path.join('/')}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      cookie: req.headers.get('cookie') ?? '',
      'content-type': req.headers.get('content-type') ?? 'application/json',
    },
    cache: 'no-store',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }
  const res = await fetch(target, init);
  const body = await res.text();
  const response = new NextResponse(body, { status: res.status });
  response.headers.set('content-type', res.headers.get('content-type') ?? 'application/json');
  // Pass through any Set-Cookie from the API (auth flows).
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) response.headers.set('set-cookie', setCookie);
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
