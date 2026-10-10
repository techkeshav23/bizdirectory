import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-slate-700">
        We collect only the data needed to operate the directory (your phone number for login,
        business details you publish, and contact-event counts for business owners). We comply with
        the Digital Personal Data Protection Act, 2023. You can request deletion or export of your
        data at any time.
      </p>
    </div>
  );
}
