import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/dash/Sidebar';
import { Topbar } from '@/components/dash/Topbar';
import { CommandPalette } from '@/components/dash/CommandPalette';

export const metadata: Metadata = { robots: { index: false } };

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');

  const user = {
    name: session.fullName ?? '',
    email: session.email,
    phone: session.phone,
    isAdmin: session.isAdmin,
    isOwner: session.isOwner,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a
        href="#dash-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main id="dash-main" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
        </main>
      </div>
      <CommandPalette isAdmin={user.isAdmin} isOwner={user.isOwner} />
    </div>
  );
}
