import { ListingGridSkeleton } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-2 h-9 w-64" />
      <Skeleton className="mb-7 mt-2 h-4 w-40" />
      <ListingGridSkeleton count={6} />
    </div>
  );
}
