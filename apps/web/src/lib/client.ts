'use client';

/** Client-side fetch through the Next proxy (forwards httpOnly auth cookie). */
export async function clientApi<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Request failed (${res.status})`);
  }
  return res.json().catch(() => ({})) as Promise<T>;
}
