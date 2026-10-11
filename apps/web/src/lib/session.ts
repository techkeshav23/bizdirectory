import 'server-only';
import { cookies } from 'next/headers';
import { serverEnv } from '@/env';
import type { UserRole } from '@app/types';

export interface SessionUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  isAdmin: boolean;
  isOwner: boolean;
  isPhoneVerified: boolean;
}

/**
 * Server-side session read. Forwards the httpOnly auth cookie to the API's
 * /auth/me endpoint and returns the authenticated user (or null). Used by
 * dashboard layouts for real role gating (not cookie-presence guessing).
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const header = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  if (!header.includes('access_token') && !header.includes('refresh_token')) return null;

  try {
    const res = await fetch(`${serverEnv.API_INTERNAL_URL}/auth/me`, {
      headers: { cookie: header },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const u = (await res.json()) as {
      id: string;
      phone: string;
      email: string | null;
      fullName: string | null;
      role: UserRole;
      isPhoneVerified: boolean;
    };
    if (!u?.id) return null;
    return {
      ...u,
      isAdmin: u.role === 'admin',
      isOwner: u.role === 'business_owner' || u.role === 'admin',
    };
  } catch {
    return null;
  }
}
