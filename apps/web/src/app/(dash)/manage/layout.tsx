import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

// Any signed-in user can reach "My Business" — a customer with no listings sees
// the empty state and can create their first one (which promotes them to owner).
export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/manage');
  return <>{children}</>;
}
