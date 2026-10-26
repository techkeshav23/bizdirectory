import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

// Server-side role gate: only business owners (or admins) may manage listings.
export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/manage');
  if (!session.isOwner) redirect('/dashboard');
  return <>{children}</>;
}
