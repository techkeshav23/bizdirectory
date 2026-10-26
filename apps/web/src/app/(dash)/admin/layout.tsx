import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

// Server-side role gate: only admins may render anything under /admin.
// Without this, a logged-in customer could open /admin/* and see the shell.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (!session.isAdmin) redirect('/dashboard');
  return <>{children}</>;
}
