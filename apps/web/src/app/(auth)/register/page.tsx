'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi } from '@/lib/client';
import { Button } from '@/components/ui/Button';
import type { CategoryDto, LocationDto } from '@/lib/types';

type Step = 'phone' | 'otp' | 'details' | 'gstin' | 'done';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        List your business
      </h1>
      <p className="mt-1 text-sm text-muted">
        Step {['phone', 'otp', 'details', 'gstin', 'done'].indexOf(step) + 1} of 5
      </p>
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {step === 'phone' && (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () => clientApi('POST', '/auth/otp/request', { phone, purpose: 'login' }),
              () => setStep('otp'),
            );
          }}
        >
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your mobile number"
            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500"
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            Send OTP
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () => clientApi('POST', '/auth/otp/verify', { phone, code }),
              () => setStep('details'),
            );
          }}
        >
          <input
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit OTP"
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-center tracking-widest outline-none focus:border-brand-500"
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            Verify
          </Button>
        </form>
      )}

      {step === 'details' && (
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () =>
                clientApi<{ id: string }>('POST', '/businesses', {
                  ...form,
                  contactPhone: form.contactPhone || phone,
                  whatsappNumber: form.whatsappNumber || undefined,
                }),
              (r) => {
                setBusinessId(r.id);
                setStep('gstin');
              },
            );
          }}
        >
          <input
            required
            placeholder="Business name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500"
          />
          <textarea
            placeholder="Short description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
          />
          <select
            required
            value={form.primaryCategoryId}
            onChange={(e) => setForm({ ...form, primaryCategoryId: e.target.value })}
            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500"
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
            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500"
          >
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="WhatsApp number (optional)"
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-brand-500"
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            Create &amp; continue
          </Button>
        </form>
      )}

      {step === 'gstin' && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted">
            Add your GSTIN to get a “Verified” badge (optional — you can skip and add later).
          </p>
          <input
            placeholder="15-digit GSTIN"
            value={gstin}
            maxLength={15}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            className="h-11 w-full rounded-lg border border-slate-300 px-3 uppercase outline-none focus:border-brand-500"
          />
          {legalName && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Verified: {legalName}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={loading || gstin.length !== 15}
              onClick={() =>
                void run(
                  () => clientApi<{ legalName: string }>('POST', `/businesses/${businessId}/gstin`, { gstin }),
                  (r) => setLegalName(r.legalName),
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
          <h2 className="mt-2 text-lg font-semibold">Submitted for review</h2>
          <p className="mt-1 text-sm text-muted">
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
