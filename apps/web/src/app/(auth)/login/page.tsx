'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await clientApi('POST', '/auth/login', { email, password });
      router.push(search.get('next') ?? '/dashboard');
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Log in to manage your listings and saved businesses.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
