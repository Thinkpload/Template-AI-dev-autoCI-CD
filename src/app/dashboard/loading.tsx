import { Skeleton } from '@/components/ui/skeleton';

// Renders inside DashboardLayout — sidebar and header are already present.
// Only skeleton the main content area.
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
