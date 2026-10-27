'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CategoryDto, LocationDto } from '@/lib/types';

type Step = 'signup' | 'details' | 'gstin' | 'done';
const STEPS: Step[] = ['signup', 'details', 'gstin', 'done'];

const selectClass =
  'h-11 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none focus:border-ring';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('signup');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Already signed in? Skip the signup step — go straight to listing details.
  useEffect(() => {
    clientApi('GET', '/auth/me')
      .then(() => {
        setIsLoggedIn(true);
        setStep('details');
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  // signup
  const [account, setAccount] = useState({ fullName: '', email: '', password: '' });

  // business
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [cities, setCities] = useState<LocationDto[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    primaryCategoryId: '',
    locationId: '',
    contactPhone: '',
    whatsappNumber: '',
  });
  const [businessId, setBusinessId] = useState('');
  const [gstin, setGstin] = useState('');
  const [legalName, setLegalName] = useState('');
  const [gstinFailed, setGstinFailed] = useState(false);

  useEffect(() => {
    if (step !== 'details') return;
    void clientApi<CategoryDto[]>('GET', '/categories').then(setCategories).catch(() => {});
    void clientApi<LocationDto[]>('GET', '/locations?type=city').then(setCities).catch(() => {});
  }, [step]);

  async function run<T>(fn: () => Promise<T>, onOk: (r: T) => void) {
    setError('');
    setLoading(true);
    try {
      onOk(await fn());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const flow: Step[] = isLoggedIn ? ['details', 'gstin', 'done'] : STEPS;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        List your business
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step {Math.max(1, flow.indexOf(step) + 1)} of {flow.length}
      </p>
      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 'signup' && (
        <>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(
                () =>
                  clientApi('POST', '/auth/register', {
                    email: account.email,
                    password: account.password,
                    fullName: account.fullName || undefined,
                  }),
                () => setStep('details'),
              );
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Your name</Label>
              <Input
                id="fullName"
                value={account.fullName}
                onChange={(e) => setAccount({ ...account, fullName: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account & continue'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}

      {step === 'details' && (
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () =>
                clientApi<{ id: string }>('POST', '/businesses', {
                  name: form.name,
                  description: form.description || undefined,
                  primaryCategoryId: form.primaryCategoryId,
                  locationId: form.locationId,
                  contactPhone: form.contactPhone,
                  whatsappNumber: form.whatsappNumber || undefined,
                }),
              (r) => {
                setBusinessId(r.id);
                setStep('gstin');
              },
            );
          }}
        >
          <Input
            required
            placeholder="Business name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            placeholder="Short description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-20 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <select
            required
            value={form.primaryCategoryId}
            onChange={(e) => setForm({ ...form, primaryCategoryId: e.target.value })}
            className={selectClass}
          >
            <option value="">Select category</option>
            {categories.filter((c) => !c.parentId).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            required
            value={form.locationId}
            onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            className={selectClass}
          >
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input
            required
            placeholder="Contact phone (shown to customers)"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          />
          <Input
            placeholder="WhatsApp number (optional)"
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            Create &amp; continue
          </Button>
        </form>
      )}

      {step === 'gstin' && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Add your GSTIN to get a &ldquo;Verified&rdquo; badge (optional — you can skip and add
            later).
          </p>
          <Input
            placeholder="15-digit GSTIN"
            value={gstin}
            maxLength={15}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            className="uppercase"
          />
          {legalName && (
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success ring-1 ring-success/20">
              Verified: {legalName}
            </div>
          )}
          {gstinFailed && !legalName && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
              Verification failed — double-check the GSTIN, or skip and add it later.
            </div>
          )}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={loading || gstin.length !== 15}
              onClick={() =>
                void run(
                  () =>
                    clientApi<{ legalName: string | null; gstinStatus: string }>(
                      'POST',
                      `/businesses/${businessId}/gstin`,
                      { gstin },
                    ),
                  (r) => {
                    if (r.legalName && r.gstinStatus === 'verified') {
                      setLegalName(r.legalName);
                      setGstinFailed(false);
                    } else {
                      setGstinFailed(true);
                    }
                  },
                )
              }
            >
              Verify GSTIN
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={loading}
              onClick={() =>
                void run(
                  () => clientApi('POST', `/businesses/${businessId}/submit`),
                  () => setStep('done'),
                )
              }
            >
              {legalName ? 'Submit' : 'Skip & submit'}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="mt-6 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Submitted for review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Our team will review your listing shortly. You can manage it from your dashboard.
          </p>
          <Button className="mt-5 w-full" onClick={() => router.push('/manage')}>
            Go to dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
