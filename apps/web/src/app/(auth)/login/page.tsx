'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await clientApi('POST', '/auth/otp/request', { phone, purpose: 'login' });
      setStep('otp');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await clientApi('POST', '/auth/otp/verify', { phone, code });
      router.push(search.get('next') ?? '/dashboard');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Login or Sign up</h1>
      <p className="mt-1 text-sm text-muted">
        {step === 'phone'
          ? 'Enter your mobile number to receive an OTP.'
          : `Enter the 6-digit code sent to ${phone}.`}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {step === 'phone' ? (
        <form onSubmit={requestOtp} className="mt-5 space-y-4">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            className="h-11 w-full rounded-lg border border-input px-3 outline-none focus:border-brand-500"
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send OTP'}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-5 space-y-4">
          <input
            inputMode="numeric"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="______"
            className="h-11 w-full rounded-lg border border-input px-3 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500"
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & continue'}
          </Button>
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full text-sm text-muted hover:text-ink"
          >
            Change number
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-xs text-muted">
        In development, your OTP is printed in the API server logs.
      </p>
    </div>
  );
}
