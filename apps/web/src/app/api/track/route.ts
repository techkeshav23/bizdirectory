import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/env';

/** Receives sendBeacon contact events and forwards to the API. Always fast. */
export async function POST(req: NextRequest) {
  const body = await req.text();
  void fetch(`${serverEnv.API_INTERNAL_URL}/contact/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
    body,
  }).catch(() => undefined);
  return new NextResponse(null, { status: 204 });
}
