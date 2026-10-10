import { serverEnv } from '@/env';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface FetchOptions {
  revalidate?: number | false;
  tags?: string[];
  cookie?: string;
}

/** Server-side typed fetch to the NestJS API. */
export async function apiGet<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const res = await fetch(`${serverEnv.API_INTERNAL_URL}${path}`, {
    headers: opts.cookie ? { cookie: opts.cookie } : {},
    next: {
      ...(opts.revalidate !== undefined ? { revalidate: opts.revalidate } : {}),
      ...(opts.tags ? { tags: opts.tags } : {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function apiSend<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  cookie?: string,
): Promise<T> {
  const res = await fetch(`${serverEnv.API_INTERNAL_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${method} ${path} failed (${res.status})`);
  }
  return res.json().catch(() => ({})) as Promise<T>;
}
