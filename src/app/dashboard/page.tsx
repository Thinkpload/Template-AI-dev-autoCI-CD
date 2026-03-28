import { EmptyState } from '@/components/shared/EmptyState';

export default function DashboardPage() {
  return (
    <EmptyState
      title="Welcome to your dashboard"
      description="You haven't set anything up yet."
      ctaLabel="Get started →"
      ctaHref="/dashboard/settings"
    />
  );
}
